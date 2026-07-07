import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { getEncryptionService } from '../../services/EncryptionService.js';

// Cifrado de payloads habilitado con ENCRYPT_EVENT_PAYLOADS=true
const ENCRYPT_PAYLOADS = process.env.ENCRYPT_EVENT_PAYLOADS === 'true';

export interface Event {
  id?: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  userId?: string;
  previousEventHash?: string;
  timestamp?: Date;
}

export interface StoredEvent extends Event {
  id: string;
  eventHash: string;
  timestamp: Date;
}

/**
 * EventStore - Immutable append-only event log
 * Implements the core event sourcing pattern with integrity verification
 */
export class EventStore {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Append an event to the event store (immutable, append-only)
   */
  async append(event: Event): Promise<StoredEvent> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Lock por aggregate: serializa appends concurrentes del MISMO aggregate
      // (evita que dos procesos lean el mismo previous_event_hash y forken la
      // cadena) sin bloquear appends de aggregates DISTINTOS. Se usa advisory
      // lock (no SELECT ... FOR UPDATE) porque el primer evento de un
      // aggregate no tiene fila previa que bloquear. Se libera automáticamente
      // en COMMIT/ROLLBACK (pg_advisory_xact_lock).
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [event.aggregateId]);

      const eventId = event.id || uuidv4();
      const timestamp = event.timestamp || new Date();

      // Get previous event hash for chain verification
      const previousEventResult = await client.query(
        `SELECT event_hash FROM events
         WHERE aggregate_id = $1
         ORDER BY timestamp DESC
         LIMIT 1`,
        [event.aggregateId]
      );

      const previousEventHash = previousEventResult.rows[0]?.event_hash;

      // El hash se calcula SIEMPRE sobre el payload plano (antes de cifrar)
      // Garantiza que verifyIntegrity funcione con o sin cifrado habilitado
      const eventHash = this.calculateHash({
        id: eventId,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        payload: event.payload,
        timestamp,
        previousEventHash,
      });

      // Cifrar payload si está habilitado — el sobre JSONB coexiste con registros no cifrados
      const storedPayload = ENCRYPT_PAYLOADS
        ? getEncryptionService().encryptJson(event.payload)
        : event.payload;

      // Insert event (append-only)
      const result = await client.query(
        `INSERT INTO events
         (id, aggregate_id, aggregate_type, event_type, payload, metadata, user_id, previous_event_hash, event_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          eventId,
          event.aggregateId,
          event.aggregateType,
          event.eventType,
          JSON.stringify(storedPayload),
          JSON.stringify(event.metadata || {}),
          event.userId || null,
          previousEventHash || null,
          eventHash,
          timestamp,
        ]
      );

      const storedEvent = result.rows[0];

      await client.query('COMMIT');

      logger.info({
        msg: 'Event appended',
        eventId,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
      });

      return {
        id: storedEvent.id,
        aggregateId: storedEvent.aggregate_id,
        aggregateType: storedEvent.aggregate_type,
        eventType: storedEvent.event_type,
        payload: this.decryptPayload(storedEvent.payload),
        metadata: typeof storedEvent.metadata === 'string' ? JSON.parse(storedEvent.metadata) : storedEvent.metadata,
        userId: storedEvent.user_id,
        eventHash: storedEvent.event_hash,
        previousEventHash: storedEvent.previous_event_hash,
        timestamp: storedEvent.timestamp,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all events for an aggregate
   */
  async getEventsByAggregateId(aggregateId: string): Promise<StoredEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM events
       WHERE aggregate_id = $1
       ORDER BY timestamp ASC`,
      [aggregateId]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      aggregateId: row.aggregate_id as string,
      aggregateType: row.aggregate_type as string,
      eventType: row.event_type as string,
      payload: this.decryptPayload(row.payload),
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      userId: row.user_id as string | undefined,
      eventHash: row.event_hash as string,
      previousEventHash: row.previous_event_hash as string | undefined,
      timestamp: row.timestamp as Date,
    })) as StoredEvent[];
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string, limit = 100): Promise<StoredEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM events
       WHERE event_type = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [eventType, limit]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      aggregateId: row.aggregate_id as string,
      aggregateType: row.aggregate_type as string,
      eventType: row.event_type as string,
      payload: this.decryptPayload(row.payload),
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      userId: row.user_id as string | undefined,
      eventHash: row.event_hash as string,
      previousEventHash: row.previous_event_hash as string | undefined,
      timestamp: row.timestamp as Date,
    })) as StoredEvent[];
  }

  /**
   * Get all events (for replay)
   */
  async getAllEvents(limit = 10000): Promise<StoredEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM events
       ORDER BY timestamp ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      aggregateId: row.aggregate_id as string,
      aggregateType: row.aggregate_type as string,
      eventType: row.event_type as string,
      payload: this.decryptPayload(row.payload),
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      userId: row.user_id as string | undefined,
      eventHash: row.event_hash as string,
      previousEventHash: row.previous_event_hash as string | undefined,
      timestamp: row.timestamp as Date,
    })) as StoredEvent[];
  }

  /**
   * Verify event chain integrity
   * Ensures no tampering has occurred
   */
  async verifyIntegrity(aggregateId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const events = await this.getEventsByAggregateId(aggregateId);
    const errors: string[] = [];

    let previousHash: string | null = null;

    for (const event of events) {
      // Verify previous hash matches
      if (event.previousEventHash !== previousHash) {
        errors.push(`Event ${event.id} hash chain broken`);
      }

      // El hash siempre se verifica contra el payload plano (ya descifrado por getEventsByAggregateId)
      const calculatedHash = this.calculateHash({
        id: event.id,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        payload: event.payload,
        timestamp: event.timestamp,
        previousEventHash: event.previousEventHash,
      });

      if (calculatedHash !== event.eventHash) {
        errors.push(`Event ${event.id} hash mismatch`);
      }

      previousHash = event.eventHash;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Descifra el payload si está en formato de sobre cifrado.
   * Retorna el payload plano sin importar si estaba cifrado o no.
   */
  private decryptPayload(raw: unknown): Record<string, unknown> {
    const obj = typeof raw === 'string'
      ? JSON.parse(raw) as Record<string, unknown>
      : raw as Record<string, unknown>;

    if (getEncryptionService().isEncryptedEnvelope(obj)) {
      return getEncryptionService().decryptJson(obj);
    }
    return obj;
  }

  /**
   * Calculate SHA256 hash of event data
   */
  private calculateHash(data: Record<string, unknown>): string {
    const json = JSON.stringify(data, (_, v) =>
      v instanceof Date ? v.toISOString() : v
    );
    return crypto.createHash('sha256').update(json).digest('hex');
  }
}
