/**
 * Document Data Model
 * Documentary Matrix for Norma 3100 compliance tracking
 */

import { Pool, QueryResult } from 'pg';

export interface DocumentCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  standard_reference?: string;
  is_mandatory: boolean;
  expiry_months?: number;
  applies_to_all: boolean;
  service_group?: string;
  complexity_level?: string;
  version: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type DocumentStatus = 'pending' | 'compliant' | 'expired' | 'rejected' | 'under_review';
export type ComputedDocumentStatus = DocumentStatus | 'expiring_soon';

export interface ProviderDocument {
  id: string;
  provider_id: string;
  document_catalog_id: string;
  location_id?: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_path: string;
  checksum_sha256: string;
  issue_date?: Date;
  expiry_date?: Date;
  status: DocumentStatus;
  validation_notes?: string;
  validated_by?: string;
  validated_at?: Date;
  version: number;
  previous_version_id?: string;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderDocumentWithCatalog extends ProviderDocument {
  document_name: string;
  document_category: string;
  is_mandatory: boolean;
  expiry_months?: number;
  computed_status: ComputedDocumentStatus;
}

export interface DocumentComplianceSummary {
  provider_id: string;
  provider_name: string;
  total_required: number;
  compliant_count: number;
  expired_count: number;
  expiring_soon_count: number;
  pending_count: number;
  rejected_count: number;
  compliance_percentage: number;
}

export interface CreateDocumentInput {
  provider_id: string;
  document_catalog_id: string;
  location_id?: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_path: string;
  checksum_sha256: string;
  issue_date?: Date;
  expiry_date?: Date;
  uploaded_by: string;
}

export class DocumentModel {
  constructor(private pool: Pool) {}

  // === CATALOG OPERATIONS ===

  async getAllCatalogItems(filters?: { category?: string; mandatory?: boolean }): Promise<DocumentCatalog[]> {
    let query = 'SELECT * FROM document_catalog WHERE active = true';
    const params: unknown[] = [];

    if (filters?.category) {
      params.push(filters.category);
      query += ` AND category = $${params.length}`;
    }
    if (filters?.mandatory !== undefined) {
      params.push(filters.mandatory);
      query += ` AND is_mandatory = $${params.length}`;
    }

    query += ' ORDER BY category, code';
    const result: QueryResult<DocumentCatalog> = await this.pool.query(query, params);
    return result.rows;
  }

  async getCatalogByCode(code: string): Promise<DocumentCatalog | null> {
    const result: QueryResult<DocumentCatalog> = await this.pool.query(
      'SELECT * FROM document_catalog WHERE code = $1 AND active = true',
      [code]
    );
    return result.rows[0] || null;
  }

  async getCatalogCategories(): Promise<string[]> {
    const result = await this.pool.query<{ category: string }>(
      'SELECT DISTINCT category FROM document_catalog WHERE active = true ORDER BY category'
    );
    return result.rows.map(r => r.category);
  }

  // === PROVIDER DOCUMENTS OPERATIONS ===

  async createDocument(input: CreateDocumentInput): Promise<ProviderDocument> {
    // Check if previous version exists
    const prevResult = await this.pool.query<{ id: string; version: number }>(
      `SELECT id, version FROM provider_documents
       WHERE provider_id = $1 AND document_catalog_id = $2
       ORDER BY version DESC LIMIT 1`,
      [input.provider_id, input.document_catalog_id]
    );

    const nextVersion = prevResult.rows[0] ? prevResult.rows[0].version + 1 : 1;
    const previousVersionId = prevResult.rows[0]?.id || null;

    const result: QueryResult<ProviderDocument> = await this.pool.query(
      `INSERT INTO provider_documents (
        provider_id, document_catalog_id, location_id,
        filename, original_filename, mime_type, file_size_bytes,
        storage_path, checksum_sha256, issue_date, expiry_date,
        status, version, previous_version_id, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        input.provider_id,
        input.document_catalog_id,
        input.location_id || null,
        input.filename,
        input.original_filename,
        input.mime_type,
        input.file_size_bytes,
        input.storage_path,
        input.checksum_sha256,
        input.issue_date || null,
        input.expiry_date || null,
        'pending',
        nextVersion,
        previousVersionId,
        input.uploaded_by,
      ]
    );

    return result.rows[0];
  }

  async getLatestForProvider(providerId: string): Promise<ProviderDocumentWithCatalog[]> {
    const result: QueryResult<ProviderDocumentWithCatalog> = await this.pool.query(
      `SELECT * FROM provider_documents_latest WHERE provider_id = $1 ORDER BY document_category, document_name`,
      [providerId]
    );
    return result.rows;
  }

  async getDocumentById(id: string): Promise<ProviderDocument | null> {
    const result: QueryResult<ProviderDocument> = await this.pool.query(
      'SELECT * FROM provider_documents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getVersionHistory(providerId: string, catalogId: string): Promise<ProviderDocument[]> {
    const result: QueryResult<ProviderDocument> = await this.pool.query(
      `SELECT * FROM provider_documents
       WHERE provider_id = $1 AND document_catalog_id = $2
       ORDER BY version DESC`,
      [providerId, catalogId]
    );
    return result.rows;
  }

  async validateDocument(
    id: string,
    status: DocumentStatus,
    notes: string | undefined,
    validatorId: string
  ): Promise<ProviderDocument | null> {
    const result: QueryResult<ProviderDocument> = await this.pool.query(
      `UPDATE provider_documents
       SET status = $1, validation_notes = $2, validated_by = $3, validated_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, notes || null, validatorId, id]
    );
    return result.rows[0] || null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM provider_documents WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  async getComplianceSummary(providerId: string): Promise<DocumentComplianceSummary | null> {
    const result: QueryResult<DocumentComplianceSummary> = await this.pool.query(
      'SELECT * FROM provider_document_compliance WHERE provider_id = $1',
      [providerId]
    );
    return result.rows[0] || null;
  }

  async getExpiringDocuments(daysAhead: number = 30): Promise<ProviderDocumentWithCatalog[]> {
    const result: QueryResult<ProviderDocumentWithCatalog> = await this.pool.query(
      `SELECT * FROM provider_documents_latest
       WHERE expiry_date IS NOT NULL
         AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
       ORDER BY expiry_date ASC`,
      [daysAhead.toString()]
    );
    return result.rows;
  }

  async getMissingDocuments(providerId: string): Promise<DocumentCatalog[]> {
    const result: QueryResult<DocumentCatalog> = await this.pool.query(
      `SELECT dc.* FROM document_catalog dc
       WHERE dc.active = true AND dc.is_mandatory = true
         AND NOT EXISTS (
           SELECT 1 FROM provider_documents pd
           WHERE pd.provider_id = $1 AND pd.document_catalog_id = dc.id
         )
       ORDER BY dc.category, dc.code`,
      [providerId]
    );
    return result.rows;
  }
}
