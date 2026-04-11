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
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
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

export class DocumentService {
  private model: DocumentModel;

  constructor(pool: Pool, private eventStore: EventStore) {
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
    await this.eventStore.appendEvent({
      aggregate_id: document.id,
      aggregate_type: 'provider_document',
      event_type: 'DocumentUploaded',
      event_data: {
        provider_id: input.provider_id,
        document_code: catalogItem.code,
        version: document.version,
        checksum,
      },
      user_id: input.uploaded_by,
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
    if (!doc) return null;

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
        filename: doc.original_filename,
        mime_type: doc.mime_type,
      };
    } catch (err) {
      logger.error({ msg: 'Failed to retrieve document file', document_id: documentId, error: err });
      return null;
    }
  }

  async validateProviderDocument(
    documentId: string,
    status: DocumentStatus,
    notes: string | undefined,
    validatorId: string
  ): Promise<ProviderDocument | null> {
    const result = await this.model.validateDocument(documentId, status, notes, validatorId);
    if (result) {
      await this.eventStore.appendEvent({
        aggregate_id: documentId,
        aggregate_type: 'provider_document',
        event_type: 'DocumentValidated',
        event_data: { status, notes },
        user_id: validatorId,
      });
    }
    return result;
  }

  async getProviderDocuments(providerId: string): Promise<ProviderDocumentWithCatalog[]> {
    return this.model.getLatestForProvider(providerId);
  }

  async getCatalog(filters?: { category?: string; mandatory?: boolean }): Promise<DocumentCatalog[]> {
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
}
