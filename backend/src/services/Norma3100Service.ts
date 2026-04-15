/**
 * Norma 3100 Service
 * Loads and manages Norma 3100 compliance model from JSON
 * Provides criteria, standards, and questionnaire data without database dependency
 *
 * Used when database is not available (development, testing, or initial setup)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Criterion {
  code: string;
  number: string;
  text: string;
  complexity: 'simple' | 'medium' | 'high';
  is_mandatory: boolean;
  state?: string;
  section?: string;
}

export interface Standard {
  code: string;
  name: string;
  is_transversal: boolean;
  sheet_ref: string;
  criteria_count: number;
  criteria: Criterion[];
}

export interface ServiceSpecificStandard {
  code: string;
  parent_transversal: string;
  criteria: Array<{
    number: string;
    text: string;
    is_mandatory: boolean;
    state?: string;
  }>;
}

export interface Service {
  code: string;
  name: string;
  sheet_ref: string;
  applicable_transversal_standards: string[];
  specific_standards: ServiceSpecificStandard[];
  multi_instance?: boolean;
  max_instances?: number;
  instance_label?: string;
}

export interface ServiceGroup {
  group_code: string;
  group_name: string;
  services: Service[];
}

export interface Norma3100Model {
  version: string;
  source: string;
  standards: Standard[];
  service_groups: ServiceGroup[];
  statistics: Record<string, number>;
}

export interface Questionnaire {
  id: string;
  name: string;
  serviceCode: string;
  serviceName: string;
  versionType: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  status: 'draft' | 'published';
  totalCriteria: number;
  criteria: QuestionnaireQuestion[];
}

export interface QuestionnaireQuestion {
  id: string;
  code: string;
  number: string;
  text: string;
  standardCode: string;
  standardName: string;
  isTransversal: boolean;
  complexity: string;
  isMandatory: boolean;
}

export interface ServiceListItem {
  code: string;
  name: string;
  groupName: string;
  totalCriteria: number;
}

// ============================================================
// NORMA 3100 SERVICE
// ============================================================

export class Norma3100Service {
  private model: Norma3100Model | null = null;
  private modelPath: string;

  constructor() {
    this.modelPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'docs',
      'norma3100-model.json'
    );
  }

  /**
   * Load the Norma 3100 JSON model
   */
  async loadModel(): Promise<Norma3100Model> {
    if (this.model) {
      return this.model;
    }

    try {
      const content = fs.readFileSync(this.modelPath, 'utf-8');
      this.model = JSON.parse(content);

      logger.info({
        msg: 'Norma 3100 model loaded successfully',
        standards: this.model.standards.length,
        services: this.model.service_groups.reduce(
          (sum, g) => sum + g.services.length,
          0
        ),
      });

      return this.model;
    } catch (error: any) {
      logger.error({
        msg: 'Failed to load Norma 3100 model',
        error: error.message,
        path: this.modelPath,
      });
      throw new Error(
        `No se pudo cargar el modelo Norma 3100 desde ${this.modelPath}`
      );
    }
  }

  /**
   * Get all available services
   */
  async getServices(): Promise<ServiceListItem[]> {
    const model = await this.loadModel();
    const services: ServiceListItem[] = [];

    for (const group of model.service_groups) {
      for (const service of group.services) {
        const totalCriteria = service.specific_standards.reduce(
          (sum, ss) => sum + ss.criteria.length,
          0
        );

        services.push({
          code: service.code,
          name: service.name,
          groupName: group.group_name,
          totalCriteria,
        });
      }
    }

    return services;
  }

  /**
   * Get transversal standards
   */
  async getTransversalStandards(): Promise<Standard[]> {
    const model = await this.loadModel();
    return model.standards;
  }

  /**
   * Get a specific service with all its criteria
   */
  async getService(serviceCode: string): Promise<Service | null> {
    const model = await this.loadModel();

    for (const group of model.service_groups) {
      const service = group.services.find((s) => s.code === serviceCode);
      if (service) {
        return service;
      }
    }

    return null;
  }

  /**
   * Create a questionnaire for a service
   * Combines transversal criteria + service-specific criteria
   */
  async createQuestionnaire(
    serviceCode: string,
    versionType: 'initial' | 'year4' | 'annual' | 'pre-novelty' = 'initial'
  ): Promise<Questionnaire> {
    const model = await this.loadModel();
    const service = await this.getService(serviceCode);

    if (!service) {
      throw new Error(`Servicio no encontrado: ${serviceCode}`);
    }

    const questionnaireId = uuidv4();
    const questions: QuestionnaireQuestion[] = [];
    let questionOrder = 1;

    // Add transversal criteria
    for (const standard of model.standards) {
      for (const criterion of standard.criteria) {
        questions.push({
          id: uuidv4(),
          code: criterion.code,
          number: criterion.number,
          text: criterion.text,
          standardCode: standard.code,
          standardName: standard.name,
          isTransversal: true,
          complexity: criterion.complexity,
          isMandatory: criterion.is_mandatory,
        });
        questionOrder++;
      }
    }

    // Add service-specific criteria
    for (const serviceStandard of service.specific_standards) {
      const parentStandard = model.standards.find(
        (s) => s.code === serviceStandard.parent_transversal
      );

      for (const criterion of serviceStandard.criteria) {
        questions.push({
          id: uuidv4(),
          code: `${serviceStandard.code}-${criterion.number}`,
          number: criterion.number,
          text: criterion.text,
          standardCode: serviceStandard.code,
          standardName: parentStandard?.name || serviceStandard.parent_transversal,
          isTransversal: false,
          complexity: 'simple',
          isMandatory: criterion.is_mandatory,
        });
        questionOrder++;
      }
    }

    const questionnaire: Questionnaire = {
      id: questionnaireId,
      name: `Evaluación ${service.name} - ${versionType}`,
      serviceCode: service.code,
      serviceName: service.name,
      versionType,
      status: 'published',
      totalCriteria: questions.length,
      criteria: questions,
    };

    logger.info({
      msg: 'Questionnaire created from Norma 3100 model',
      questionnaire_id: questionnaireId,
      service_code: serviceCode,
      total_criteria: questions.length,
    });

    return questionnaire;
  }

  /**
   * Get criteria for a specific standard and service
   */
  async getCriteriaForStandardAndService(
    serviceCode: string,
    standardCode: string
  ): Promise<QuestionnaireQuestion[]> {
    const model = await this.loadModel();
    const service = await this.getService(serviceCode);

    if (!service) {
      return [];
    }

    const questions: QuestionnaireQuestion[] = [];

    // If requesting transversal standard
    if (service.applicable_transversal_standards.includes(standardCode)) {
      const standard = model.standards.find((s) => s.code === standardCode);
      if (standard) {
        for (const criterion of standard.criteria) {
          questions.push({
            id: uuidv4(),
            code: criterion.code,
            number: criterion.number,
            text: criterion.text,
            standardCode: standard.code,
            standardName: standard.name,
            isTransversal: true,
            complexity: criterion.complexity,
            isMandatory: criterion.is_mandatory,
          });
        }
      }
    }

    // If requesting service-specific standard
    const serviceStandard = service.specific_standards.find(
      (ss) => ss.code === standardCode
    );
    if (serviceStandard) {
      const parentStandard = model.standards.find(
        (s) => s.code === serviceStandard.parent_transversal
      );

      for (const criterion of serviceStandard.criteria) {
        questions.push({
          id: uuidv4(),
          code: `${serviceStandard.code}-${criterion.number}`,
          number: criterion.number,
          text: criterion.text,
          standardCode: serviceStandard.code,
          standardName: parentStandard?.name || serviceStandard.parent_transversal,
          isTransversal: false,
          complexity: 'simple',
          isMandatory: criterion.is_mandatory,
        });
      }
    }

    return questions;
  }

  /**
   * Calculate assessment metrics from responses
   */
  calculateMetrics(
    responses: Record<string, 'C' | 'NC' | 'NA'>,
    allCriteria: QuestionnaireQuestion[]
  ) {
    let cumple = 0;
    let noCumple = 0;
    let noAplica = 0;
    let mandatory = 0;

    for (const criterion of allCriteria) {
      const response = responses[criterion.id];

      if (!response) {
        continue;
      }

      if (response === 'C') {
        cumple++;
      } else if (response === 'NC') {
        noCumple++;
      } else if (response === 'NA') {
        noAplica++;
      }

      if (criterion.isMandatory) {
        mandatory++;
      }
    }

    const totalCriteria = allCriteria.length;
    const evaluatedCriteria = cumple + noCumple + noAplica;
    const compliancePercent =
      evaluatedCriteria > 0 ? (cumple / evaluatedCriteria) * 100 : 0;

    // Determine semáforo color
    let semaforo: 'verde' | 'naranja' | 'rojo';
    if (compliancePercent >= 80) {
      semaforo = 'verde';
    } else if (compliancePercent >= 50) {
      semaforo = 'naranja';
    } else {
      semaforo = 'rojo';
    }

    return {
      totalCriteria,
      evaluatedCriteria,
      cumple,
      noCumple,
      noAplica,
      compliancePercent: Math.round(compliancePercent * 100) / 100,
      semaforo,
      complianceByStandard: this.calculateByStandard(
        responses,
        allCriteria
      ),
    };
  }

  /**
   * Calculate metrics grouped by standard
   */
  private calculateByStandard(
    responses: Record<string, 'C' | 'NC' | 'NA'>,
    allCriteria: QuestionnaireQuestion[]
  ) {
    const byStandard: Record<
      string,
      {
        code: string;
        name: string;
        totalCriteria: number;
        cumple: number;
        noCumple: number;
        noAplica: number;
        compliancePercent: number;
      }
    > = {};

    for (const criterion of allCriteria) {
      if (!byStandard[criterion.standardCode]) {
        byStandard[criterion.standardCode] = {
          code: criterion.standardCode,
          name: criterion.standardName,
          totalCriteria: 0,
          cumple: 0,
          noCumple: 0,
          noAplica: 0,
          compliancePercent: 0,
        };
      }

      byStandard[criterion.standardCode].totalCriteria++;

      const response = responses[criterion.id];
      if (response === 'C') {
        byStandard[criterion.standardCode].cumple++;
      } else if (response === 'NC') {
        byStandard[criterion.standardCode].noCumple++;
      } else if (response === 'NA') {
        byStandard[criterion.standardCode].noAplica++;
      }
    }

    // Calculate percentages
    for (const standard of Object.values(byStandard)) {
      const evaluated = standard.cumple + standard.noCumple + standard.noAplica;
      standard.compliancePercent =
        evaluated > 0 ? (standard.cumple / evaluated) * 100 : 0;
      standard.compliancePercent =
        Math.round(standard.compliancePercent * 100) / 100;
    }

    return Object.values(byStandard);
  }

  /**
   * Generate hallazgos from non-compliant criteria
   */
  generateHallazgos(
    assessmentId: string,
    responses: Record<string, 'C' | 'NC' | 'NA'>,
    allCriteria: QuestionnaireQuestion[]
  ) {
    const hallazgos: Array<{
      id: string;
      assessmentId: string;
      criterionId: string;
      criterionCode: string;
      criterionText: string;
      standardCode: string;
      severity: 'baja' | 'media' | 'alta' | 'crítica';
      findingDescription: string;
      createdAt: Date;
    }> = [];

    for (const criterion of allCriteria) {
      if (responses[criterion.id] === 'NC') {
        const severity = criterion.complexity === 'high' ? 'crítica' : 'media';

        hallazgos.push({
          id: uuidv4(),
          assessmentId,
          criterionId: criterion.id,
          criterionCode: criterion.code,
          criterionText: criterion.text,
          standardCode: criterion.standardCode,
          severity,
          findingDescription: `No cumple con criterio ${criterion.code}: ${criterion.text}`,
          createdAt: new Date(),
        });
      }
    }

    return hallazgos;
  }
}

// Export singleton instance
export const norma3100Service = new Norma3100Service();
