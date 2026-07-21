import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'norma3100',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
});

async function runMigration(direction: 'up' | 'down'): Promise<void> {
  const client = await pool.connect();

  try {
    if (direction === 'up') {
      console.log('Running migrations UP...');

      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Helper function to execute schema file
      const executeSchemaFile = async (filePath: string, migrationName: string) => {
        if (!fs.existsSync(filePath)) return;

        const already = await client.query(
          'SELECT 1 FROM migrations WHERE name = $1',
          [migrationName]
        );
        if ((already.rowCount ?? 0) > 0) {
          console.log(`Skipping already-applied migration: ${migrationName}`);
          return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        let statements = content
          .split(';')
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
          try {
            await client.query(statement);
          } catch (err) {
            console.error(`Error executing ${migrationName}:`, statement.substring(0, 100));
            console.error(err);
          }
        }

        // Record migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
          [migrationName]
        );
      };

      // Execute schema files in order
      await executeSchemaFile(path.join(__dirname, 'schema.sql'), '01-initial-schema');
      await executeSchemaFile(path.join(__dirname, 'evaluation-schema.sql'), '02-evaluation-schema');
      await executeSchemaFile(path.join(__dirname, 'schema-phase3.sql'), '03-phase3-schema');
      await executeSchemaFile(path.join(__dirname, 'assessment-execution-schema.sql'), '04-assessment-execution-schema');
      await executeSchemaFile(path.join(__dirname, 'findings-workflow-schema.sql'), '05-findings-workflow-schema');
      await executeSchemaFile(path.join(__dirname, 'documents-schema.sql'), '06-documents-schema');
      await executeSchemaFile(path.join(__dirname, 'invima-schema.sql'), '07-invima-schema');

      // Execute migrations in chronological order
      const migrationsDir = path.join(__dirname, 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs
          .readdirSync(migrationsDir)
          .filter((file) => file.endsWith('.sql'))
          .sort();

        for (const file of migrationFiles) {
          await executeSchemaFile(path.join(migrationsDir, file), `migration-${file}`);
        }
      }

      console.log('Migrations UP completed successfully');
    } else if (direction === 'down') {
      console.log('Running migrations DOWN (rollback)...');

      // Drop all tables in reverse order (respecting foreign keys)
      const dropStatements = [
        'DROP TABLE IF EXISTS user_sessions CASCADE',
        'DROP TABLE IF EXISTS audit_logs CASCADE',
        'DROP TABLE IF EXISTS events CASCADE',
        'DROP TABLE IF EXISTS documents CASCADE',
        'DROP TABLE IF EXISTS documentary_matrix CASCADE',
        'DROP TABLE IF EXISTS escalation_alerts CASCADE',
        'DROP TABLE IF EXISTS action_comments CASCADE',
        'DROP TABLE IF EXISTS action_evidence CASCADE',
        'DROP TABLE IF EXISTS action_status_history CASCADE',
        'DROP TABLE IF EXISTS finding_status_history CASCADE',
        'DROP TABLE IF EXISTS finding_categories CASCADE',
        'DROP TABLE IF EXISTS corrective_actions CASCADE',
        'DROP TABLE IF EXISTS findings CASCADE',
        'DROP TABLE IF EXISTS assessment_responses CASCADE',
        'DROP TABLE IF EXISTS assessments CASCADE',
        'DROP TABLE IF EXISTS question_options CASCADE',
        'DROP TABLE IF EXISTS questions CASCADE',
        'DROP TABLE IF EXISTS questionnaire_sections CASCADE',
        'DROP TABLE IF EXISTS questionnaires CASCADE',
        'DROP TABLE IF EXISTS evaluation_criteria CASCADE',
        'DROP TABLE IF EXISTS permissions CASCADE',
        'DROP TABLE IF EXISTS roles CASCADE',
        'DROP TABLE IF EXISTS users CASCADE',
        'DROP TABLE IF EXISTS services_enabled CASCADE',
        'DROP TABLE IF EXISTS services CASCADE',
        'DROP TABLE IF EXISTS locations CASCADE',
        'DROP TABLE IF EXISTS providers CASCADE',
        'DROP TABLE IF EXISTS migrations CASCADE',
      ];

      for (const statement of dropStatements) {
        try {
          await client.query(statement);
        } catch (err) {
          console.error('Error executing statement:', statement);
          console.error(err);
        }
      }

      console.log('Migrations DOWN completed successfully');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI
const args = process.argv.slice(2);
const direction = args[0] as 'up' | 'down' | undefined;

if (!direction || !['up', 'down'].includes(direction)) {
  console.error('Usage: ts-node migrations.ts [up|down]');
  process.exit(1);
}

runMigration(direction).catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
