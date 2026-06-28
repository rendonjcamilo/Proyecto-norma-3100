/**
 * Document Service
 * Business logic for file uploads, validation, storage and compliance tracking
 */

import { Pool } from 'pg';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import {
  DocumentModel,
  ProviderDocument,
  ProviderDocumentWithCatalog,
  DocumentComplianceSummary,
  DocumentCatalog,
  CreateDocumentInput,
  DocumentStatus,
} from '../models/document.model.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

const STORAGE_ROOT = process.env.DOCUMENT_STORAGE_PATH || './storage/documents';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export interface UploadDocumentInput {
  provider_id: string;
  document_catalog_id: string;
  location_id?: string;
  file_buffer: Buffer;
  original_filename: string;
  mime_type: string;
  issue_date?: Date;
  expiry_date?: Date;
  uploaded_by: string;
}

export interface LinkExternalDocumentInput {
  provider_id: string;
  document_catalog_id: string;
  external_url: string;
  issue_date?: Date;
  expiry_date?: Date;
  uploaded_by: string;
}

export class DocumentService {
  private model: DocumentModel;

  constructor(private pool: Pool, private eventStore: EventStore) {
    this.model = new DocumentModel(pool);
  }

  /**
   * Validate file against policy
   */
  private validateFile(input: UploadDocumentInput): void {
    if (!ALLOWED_MIME_TYPES.has(input.mime_type)) {
      throw new Error(`Tipo de archivo no permitido: ${input.mime_type}`);
    }
    if (input.file_buffer.length === 0) {
      throw new Error('El archivo está vacío');
    }
    if (input.file_buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  /**
   * Compute SHA-256 checksum
   */
  private computeChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate safe storage path: providers/<providerId>/<catalogId>/<checksum>.<ext>
   */
  private generateStoragePath(
    providerId: string,
    catalogId: string,
    checksum: string,
    originalFilename: string
  ): { relativePath: string; absolutePath: string; filename: string } {
    const ext = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeExt = ext || '.bin';
    const filename = `${checksum.substring(0, 16)}${safeExt}`;
    const relativePath = path.posix.join('providers', providerId, catalogId, filename);
    const absolutePath = path.join(STORAGE_ROOT, relativePath);
    return { relativePath, absolutePath, filename };
  }

  /**
   * Persist file to disk (encrypted at rest in production with disk-level encryption)
   */
  private async persistFile(absolutePath: string, buffer: Buffer): Promise<void> {
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, buffer, { mode: 0o640 });
  }

  /**
   * Upload a provider document
   */
  async uploadDocument(input: UploadDocumentInput): Promise<ProviderDocument> {
    this.validateFile(input);

    // Verify catalog entry exists
    const catalogItems = await this.model.getAllCatalogItems();
    const catalogItem = catalogItems.find(c => c.id === input.document_catalog_id);
    if (!catalogItem) {
      throw new Error('Documento no encontrado en el catálogo');
    }

    const checksum = this.computeChecksum(input.file_buffer);
    const { relativePath, absolutePath, filename } = this.generateStoragePath(
      input.provider_id,
      input.document_catalog_id,
      checksum,
      input.original_filename
    );

    await this.persistFile(absolutePath, input.file_buffer);

    // Auto-compute expiry if catalog has months defined and not provided
    let expiryDate = input.expiry_date;
    if (!expiryDate && catalogItem.expiry_months && input.issue_date) {
      const d = new Date(input.issue_date);
      d.setMonth(d.getMonth() + catalogItem.expiry_months);
      expiryDate = d;
    }

    const createInput: CreateDocumentInput = {
      provider_id: input.provider_id,
      document_catalog_id: input.document_catalog_id,
      location_id: input.location_id,
      filename,
      original_filename: input.original_filename,
      mime_type: input.mime_type,
      file_size_bytes: input.file_buffer.length,
      storage_path: relativePath,
      checksum_sha256: checksum,
      issue_date: input.issue_date,
      expiry_date: expiryDate,
      uploaded_by: input.uploaded_by,
    };

    const document = await this.model.createDocument(createInput);

    // Emit audit event
    await this.eventStore.append({
      aggregateId: document.id,
      aggregateType: 'provider_document',
      eventType: 'DocumentUploaded',
      payload: {
        provider_id: input.provider_id,
        document_code: catalogItem.code,
        version: document.version,
        checksum,
      },
      userId: input.uploaded_by,
    });

    logger.info({
      msg: 'Document uploaded',
      document_id: document.id,
      provider_id: input.provider_id,
      code: catalogItem.code,
      version: document.version,
    });

    return document;
  }

  /**
   * Retrieve file buffer for download
   */
  async retrieveFile(documentId: string): Promise<{ buffer: Buffer; filename: string; mime_type: string } | null> {
    const doc = await this.model.getDocumentById(documentId);
    if (!doc) {return null;}
    if (!doc.storage_path || !doc.checksum_sha256) {return null;}

    const absolutePath = path.join(STORAGE_ROOT, doc.storage_path);
    try {
      const buffer = await fs.readFile(absolutePath);
      // Verify checksum integrity
      const checksum = this.computeChecksum(buffer);
      if (checksum !== doc.checksum_sha256) {
        logger.error({
          msg: 'Document checksum mismatch - possible tampering',
          document_id: documentId,
          expected: doc.checksum_sha256,
          actual: checksum,
        });
        throw new Error('Integridad del archivo comprometida');
      }
      return {
        buffer,
        filename: doc.original_filename ?? doc.filename ?? 'documento',
        mime_type: doc.mime_type ?? 'application/octet-stream',
      };
    } catch (err) {
      logger.error({ msg: 'Failed to retrieve document file', document_id: documentId, error: err });
      return null;
    }
  }

  /**
   * Vincula un documento externo (Google Drive) sin subir archivo
   */
  async linkExternalDocument(input: LinkExternalDocumentInput): Promise<ProviderDocument> {
    const oneDriveHosts = ['onedrive.live.com', '1drv.ms', 'sharepoint.com', 'onedrive.com'];
    let parsedHost: string;
    try {
      parsedHost = new URL(input.external_url).hostname;
    } catch {
      throw new Error('URL inválida');
    }
    const isOneDrive = oneDriveHosts.some(h => parsedHost === h || parsedHost.endsWith('.' + h));
    if (!isOneDrive) {
      throw new Error('Solo se permiten enlaces de OneDrive o SharePoint');
    }

    const catalogItems = await this.model.getAllCatalogItems();
    const catalogItem = catalogItems.find(c => c.id === input.document_catalog_id);
    if (!catalogItem) {
      throw new Error('Documento no encontrado en el catálogo');
    }

    let expiryDate = input.expiry_date;
    if (!expiryDate && catalogItem.expiry_months && input.issue_date) {
      const d = new Date(input.issue_date);
      d.setMonth(d.getMonth() + catalogItem.expiry_months);
      expiryDate = d;
    }

    const document = await this.model.createDocument({
      provider_id: input.provider_id,
      document_catalog_id: input.document_catalog_id,
      external_url: input.external_url,
      issue_date: input.issue_date,
      expiry_date: expiryDate,
      uploaded_by: input.uploaded_by,
    });

    await this.eventStore.append({
      aggregateId: document.id,
      aggregateType: 'provider_document',
      eventType: 'DocumentLinked',
      payload: {
        provider_id: input.provider_id,
        document_code: catalogItem.code,
        version: document.version,
        external_url: input.external_url,
      },
      userId: input.uploaded_by,
    });

    logger.info({
      msg: 'External document linked',
      document_id: document.id,
      provider_id: input.provider_id,
      code: catalogItem.code,
    });

    return document;
  }

  async markCompliantWithoutFile(input: {
    provider_id: string;
    document_catalog_id: string;
    uploaded_by: string;
  }): Promise<ProviderDocument> {
    const catalogItems = await this.model.getAllCatalogItems();
    const catalogItem = catalogItems.find(c => c.id === input.document_catalog_id);
    if (!catalogItem) { throw new Error('Documento no encontrado en el catálogo'); }

    const document = await this.model.createDocument({
      provider_id: input.provider_id,
      document_catalog_id: input.document_catalog_id,
      uploaded_by: input.uploaded_by,
    });

    const validated = await this.model.validateDocument(document.id, 'compliant', undefined, input.uploaded_by);

    await this.eventStore.append({
      aggregateId: document.id,
      aggregateType: 'provider_document',
      eventType: 'DocumentMarkedCompliant',
      payload: { provider_id: input.provider_id, document_code: catalogItem.code, version: document.version },
      userId: input.uploaded_by,
    });

    logger.info({ msg: 'Document marked compliant without file', document_id: document.id, code: catalogItem.code });
    return validated!;
  }

  async validateProviderDocument(
    documentId: string,
    status: DocumentStatus,
    notes: string | undefined,
    validatorId: string
  ): Promise<ProviderDocument | null> {
    const result = await this.model.validateDocument(documentId, status, notes, validatorId);
    if (result) {
      await this.eventStore.append({
        aggregateId: documentId,
        aggregateType: 'provider_document',
        eventType: 'DocumentValidated',
        payload: { status, notes: notes || null },
        userId: validatorId,
      });
    }
    return result;
  }

  async toggleNotApplicable(
    providerId: string,
    documentCatalogId: string,
    auditorId: string
  ): Promise<ProviderDocument> {
    // Buscar si ya existe un registro para este documento
    const existing = await this.model.getLatestForProvider(providerId);
    const current = existing.find((d) => d.document_catalog_id === documentCatalogId);

    if (current?.status === 'not_applicable') {
      // Si es un placeholder sin archivo, eliminarlo para que vuelva a "faltante"
      if (!current.filename) {
        await this.model.deleteDocument(current.id);
        await this.eventStore.append({
          aggregateId: current.id,
          aggregateType: 'provider_document',
          eventType: 'DocumentNotApplicableReverted',
          payload: { document_catalog_id: documentCatalogId },
          userId: auditorId,
        });
        return { ...current, status: 'pending' } as ProviderDocument;
      }
      // Si tenía archivo, revertir a pendiente
      const reverted = await this.model.validateDocument(current.id, 'pending', undefined, auditorId);
      await this.eventStore.append({
        aggregateId: current.id,
        aggregateType: 'provider_document',
        eventType: 'DocumentNotApplicableReverted',
        payload: { document_catalog_id: documentCatalogId },
        userId: auditorId,
      });
      return reverted!;
    }

    // Crear o actualizar como not_applicable
    let docId: string;
    if (current) {
      const updated = await this.model.validateDocument(current.id, 'not_applicable', undefined, auditorId);
      docId = updated!.id;
      await this.eventStore.append({
        aggregateId: docId,
        aggregateType: 'provider_document',
        eventType: 'DocumentMarkedNotApplicable',
        payload: { document_catalog_id: documentCatalogId },
        userId: auditorId,
      });
      return updated!;
    }

    // No existe registro — crearlo directamente con status not_applicable
    const created = await this.model.insertNotApplicable(providerId, documentCatalogId, auditorId);
    await this.eventStore.append({
      aggregateId: created.id,
      aggregateType: 'provider_document',
      eventType: 'DocumentMarkedNotApplicable',
      payload: { document_catalog_id: documentCatalogId },
      userId: auditorId,
    });
    return created;
  }

  async getProviderDocuments(providerId: string): Promise<ProviderDocumentWithCatalog[]> {
    return this.model.getLatestForProvider(providerId);
  }

  async getCatalog(filters?: { category?: string; mandatory?: boolean; provider_type?: string }): Promise<DocumentCatalog[]> {
    return this.model.getAllCatalogItems(filters);
  }

  async getCategories(): Promise<string[]> {
    return this.model.getCatalogCategories();
  }

  async getComplianceSummary(providerId: string): Promise<DocumentComplianceSummary | null> {
    return this.model.getComplianceSummary(providerId);
  }

  async getExpiringDocuments(daysAhead?: number): Promise<ProviderDocumentWithCatalog[]> {
    return this.model.getExpiringDocuments(daysAhead);
  }

  async getMissingDocuments(providerId: string): Promise<DocumentCatalog[]> {
    return this.model.getMissingDocuments(providerId);
  }

  async getVersionHistory(providerId: string, catalogId: string): Promise<ProviderDocument[]> {
    return this.model.getVersionHistory(providerId, catalogId);
  }

  async updateDocumentExpiry(
    documentId: string,
    expiryDate: Date | null,
    issueDate?: Date | null
  ): Promise<ProviderDocument | null> {
    const result = await this.pool.query<ProviderDocument>(
      `UPDATE provider_documents
       SET expiry_date = $1,
           issue_date  = COALESCE($2, issue_date),
           updated_at  = NOW()
       WHERE id = $3
       RETURNING *`,
      [expiryDate ?? null, issueDate ?? null, documentId]
    );
    return result.rows[0] || null;
  }
}
