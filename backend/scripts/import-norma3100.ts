#!/usr/bin/env ts-node
/**
 * Import Norma 3100 data from JSON model to PostgreSQL database
 *
 * Usage:
 *   npm run ts backend/scripts/import-norma3100.ts
 *   OR
 *   node -r tsx/esm backend/scripts/import-norma3100.ts
 *
 * This script:
 * 1. Reads docs/norma3100-model.json
 * 2. Connects to PostgreSQL via Pool
 * 3. Inserts transversal standards and criteria (321 total)
 * 4. Inserts service-specific standards and criteria (by service)
 * 5. Creates or updates questionnaires for each service
 *
 * Database tables involved:
 * - evaluation_standards (transversal + service-specific)
 * - evaluation_criteria (all criteria linked to standards)
 * - questionnaires (versioned questionnaires per service)
 * - questionnaire_criteria (links criteria to questionnaires)
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Type Definitions
// ============================================================

interface Criterion {
  code: string;
  number: string;
  text: string;
  complexity: "simple" | "medium" | "high";
  is_mandatory: boolean;
  state?: string;
  section?: string;
}

interface Standard {
  code: string;
  name: string;
  is_transversal: boolean;
  sheet_ref: string;
  criteria_count: number;
  criteria: Criterion[];
}

interface ServiceSpecificStandard {
  code: string;
  parent_transversal: string;
  criteria: Array<{
    number: string;
    text: string;
    is_mandatory: boolean;
    state?: string;
  }>;
}

interface Service {
  code: string;
  name: string;
  sheet_ref: string;
  applicable_transversal_standards: string[];
  specific_standards: ServiceSpecificStandard[];
  multi_instance?: boolean;
  max_instances?: number;
  instance_label?: string;
}

interface ServiceGroup {
  group_code: string;
  group_name: string;
  services: Service[];
}

interface Norma3100Model {
  version: string;
  source: string;
  standards: Standard[];
  service_groups: ServiceGroup[];
  statistics: Record<string, number>;
}

// ============================================================
// Main Import Script
// ============================================================

class Norma3100Importer {
  private pool: Pool;
  private model: Norma3100Model;

  constructor(pool: Pool, model: Norma3100Model) {
    this.pool = pool;
    this.model = model;
  }

  async importAll(): Promise<void> {
    try {
      console.log("\n" + "=".repeat(70));
      console.log("IMPORTING NORMA 3100 TO DATABASE");
      console.log("=".repeat(70) + "\n");

      // Import transversal standards and criteria
      console.log("Step 1: Importing 7 Transversal Standards");
      console.log("-".repeat(70));
      await this.importTransversalStandards();

      // Import service-specific standards and criteria
      console.log("\nStep 2: Importing Service-Specific Standards");
      console.log("-".repeat(70));
      await this.importServiceSpecificStandards();

      // Create questionnaires for services (optional)
      console.log("\nStep 3: Creating Questionnaires (optional)");
      console.log("-".repeat(70));
      // await this.createQuestionnaires();

      console.log("\n" + "=".repeat(70));
      console.log("IMPORT COMPLETE");
      console.log("=".repeat(70) + "\n");
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    }
  }

  private async importTransversalStandards(): Promise<void> {
    // Get list of transversal standard codes from DB
    const existingStandards = await this.pool.query(
      `SELECT code FROM evaluation_standards WHERE is_transversal = true`
    );
    const existingCodes = new Set(
      existingStandards.rows.map((row: any) => row.code)
    );

    for (const standard of this.model.standards) {
      // Insert or update standard
      let standardId: string;

      if (existingCodes.has(standard.code)) {
        // Get existing ID
        const result = await this.pool.query(
          `SELECT id FROM evaluation_standards WHERE code = $1`,
          [standard.code]
        );
        standardId = result.rows[0].id;
        console.log(
          `  [EXISTS] ${standard.code}: ${standard.name} (${standard.criteria_count} criteria)`
        );
      } else {
        // Insert new standard
        const result = await this.pool.query(
          `INSERT INTO evaluation_standards (code, name, description, is_transversal, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
          [standard.code, standard.name, standard.name, true, "active"]
        );
        standardId = result.rows[0].id;
        console.log(
          `  [NEW] ${standard.code}: ${standard.name} (${standard.criteria_count} criteria)`
        );
      }

      // Insert criteria for this standard
      for (const criterion of standard.criteria) {
        try {
          await this.pool.query(
            `INSERT INTO evaluation_criteria
           (code, number, name, description, complexity, standard_id, service_id, is_mandatory, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (code) DO NOTHING`,
            [
              criterion.code,
              criterion.number,
              criterion.code,
              criterion.text,
              criterion.complexity,
              standardId,
              null, // transversals have no service_id
              criterion.is_mandatory,
              "active",
            ]
          );
        } catch (error: any) {
          const msg = error.message ?? "";
          if (!msg.includes("duplicate key") && !msg.includes("ON CONFLICT")) {
            console.error(`  Error inserting criterion ${criterion.code}:`, msg);
          }
        }
      }
    }
  }

  private async importServiceSpecificStandards(): Promise<void> {
    // Get mapping of service codes to IDs
    const servicesResult = await this.pool.query(
      `SELECT id, code FROM services WHERE status = 'available'`
    );
    const serviceMap = new Map(
      servicesResult.rows.map((row: any) => [row.code, row.id])
    );

    // Process each service group
    for (const group of this.model.service_groups) {
      for (const service of group.services) {
        const serviceId = serviceMap.get(service.code);

        if (!serviceId) {
          console.log(
            `  [SKIP] ${service.code}: ${service.name} (service not found in DB)`
          );
          continue;
        }

        let totalCriteria = 0;

        // Import service-specific standards
        for (const specStandard of service.specific_standards) {
          // Check if this service-specific standard exists
          const existingResult = await this.pool.query(
            `SELECT id FROM evaluation_standards WHERE code = $1 AND service_id = $2`,
            [specStandard.code, serviceId]
          );

          let standardId: string;

          if (existingResult.rows.length > 0) {
            standardId = existingResult.rows[0].id;
          } else {
            // Create new service-specific standard
            const result = await this.pool.query(
              `INSERT INTO evaluation_standards
              (code, name, is_transversal, service_id, status)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id`,
              [
                specStandard.code,
                `${service.name} - ${specStandard.parent_transversal}`,
                false,
                serviceId,
                "active",
              ]
            );
            standardId = result.rows[0].id;
          }

          // Insert criteria
          for (const criterion of specStandard.criteria) {
            if (!criterion.number) continue; // skip criteria without a number
            const criterionCode = `${specStandard.code}-${criterion.number}`;
            try {
              await this.pool.query(
                `INSERT INTO evaluation_criteria
               (code, number, name, description, complexity, standard_id, service_id, is_mandatory, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (code) DO NOTHING`,
                [
                  criterionCode,
                  criterion.number,
                  criterionCode,
                  criterion.text,
                  "simple", // default complexity
                  standardId,
                  serviceId,
                  criterion.is_mandatory,
                  "active",
                ]
              );
              totalCriteria++;
            } catch (error: any) {
              const msg = error.message ?? "";
              if (!msg.includes("duplicate key") && !msg.includes("ON CONFLICT")) {
                console.error(
                  `  Error inserting criterion ${criterionCode}:`,
                  msg
                );
              }
            }
          }
        }

        console.log(
          `  [OK] ${service.code}: ${service.name} (${totalCriteria} criteria)`
        );
      }
    }
  }

  private async createQuestionnaires(): Promise<void> {
    // This is optional - can be implemented later if needed
    console.log("  (Questionnaire creation deferred)");
  }
}

// ============================================================
// Main Entry Point
// ============================================================

async function main() {
  // Read the JSON model
  // Supports both Docker (/app/scripts → /app/docs) and host (backend/scripts → docs)
  const candidates = [
    path.join(__dirname, "..", "docs", "norma3100-model.json"),
    path.join(__dirname, "..", "..", "docs", "norma3100-model.json"),
  ];
  const modelPath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];

  if (!fs.existsSync(modelPath)) {
    console.error(`Error: JSON model not found. Tried:\n  ${candidates.join("\n  ")}`);
    process.exit(1);
  }

  const modelContent = fs.readFileSync(modelPath, "utf-8");
  const model: Norma3100Model = JSON.parse(modelContent);

  // Initialize database pool
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "norma3100",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres_dev_password",
  });

  try {
    // Test connection
    const result = await pool.query("SELECT NOW()");
    console.log(`Connected to database at: ${result.rows[0].now}\n`);

    // Run importer
    const importer = new Norma3100Importer(pool, model);
    await importer.importAll();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
