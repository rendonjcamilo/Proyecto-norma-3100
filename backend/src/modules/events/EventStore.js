import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
/**
 * EventStore - Immutable append-only event log
 * Implements the core event sourcing pattern with integrity verification
 */
export class EventStore {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Append an event to the event store (immutable, append-only)
     */
    async append(event) {
        const client = await this.pool.connect();
        try {
            const eventId = event.id || uuidv4();
            const timestamp = event.timestamp || new Date();
            // Get previous event hash for chain verification
            const previousEventResult = await client.query(`SELECT event_hash FROM events
         WHERE aggregate_id = $1
         ORDER BY timestamp DESC
         LIMIT 1`, [event.aggregateId]);
            const previousEventHash = previousEventResult.rows[0]?.event_hash;
            // Calculate event hash
            const eventHash = this.calculateHash({
                id: eventId,
                aggregateId: event.aggregateId,
                aggregateType: event.aggregateType,
                eventType: event.eventType,
                payload: event.payload,
                timestamp,
                previousEventHash,
            });
            // Insert event (append-only)
            const result = await client.query(`INSERT INTO events
         (id, aggregate_id, aggregate_type, event_type, payload, metadata, user_id, previous_event_hash, event_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`, [
                eventId,
                event.aggregateId,
                event.aggregateType,
                event.eventType,
                JSON.stringify(event.payload),
                JSON.stringify(event.metadata || {}),
                event.userId || null,
                previousEventHash || null,
                eventHash,
                timestamp,
            ]);
            const storedEvent = result.rows[0];
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
                payload: typeof storedEvent.payload === 'string' ? JSON.parse(storedEvent.payload) : storedEvent.payload,
                metadata: typeof storedEvent.metadata === 'string' ? JSON.parse(storedEvent.metadata) : storedEvent.metadata,
                userId: storedEvent.user_id,
                eventHash: storedEvent.event_hash,
                previousEventHash: storedEvent.previous_event_hash,
                timestamp: storedEvent.timestamp,
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * Get all events for an aggregate
     */
    async getEventsByAggregateId(aggregateId) {
        const result = await this.pool.query(`SELECT * FROM events
       WHERE aggregate_id = $1
       ORDER BY timestamp ASC`, [aggregateId]);
        return result.rows.map((row) => ({
            id: row.id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            eventType: row.event_type,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            userId: row.user_id,
            eventHash: row.event_hash,
            previousEventHash: row.previous_event_hash,
            timestamp: row.timestamp,
        }));
    }
    /**
     * Get events by type
     */
    async getEventsByType(eventType, limit = 100) {
        const result = await this.pool.query(`SELECT * FROM events
       WHERE event_type = $1
       ORDER BY timestamp DESC
       LIMIT $2`, [eventType, limit]);
        return result.rows.map((row) => ({
            id: row.id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            eventType: row.event_type,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            userId: row.user_id,
            eventHash: row.event_hash,
            previousEventHash: row.previous_event_hash,
            timestamp: row.timestamp,
        }));
    }
    /**
     * Get all events (for replay)
     */
    async getAllEvents(limit = 10000) {
        const result = await this.pool.query(`SELECT * FROM events
       ORDER BY timestamp ASC
       LIMIT $1`, [limit]);
        return result.rows.map((row) => ({
            id: row.id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            eventType: row.event_type,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            userId: row.user_id,
            eventHash: row.event_hash,
            previousEventHash: row.previous_event_hash,
            timestamp: row.timestamp,
        }));
    }
    /**
     * Verify event chain integrity
     * Ensures no tampering has occurred
     */
    async verifyIntegrity(aggregateId) {
        const events = await this.getEventsByAggregateId(aggregateId);
        const errors = [];
        let previousHash = null;
        for (const event of events) {
            // Verify previous hash matches
            if (event.previousEventHash !== previousHash) {
                errors.push(`Event ${event.id} hash chain broken`);
            }
            // Verify event hash is correct
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
     * Calculate SHA256 hash of event data
     */
    calculateHash(data) {
        const json = JSON.stringify(data, (_, v) => v instanceof Date ? v.toISOString() : v);
        return crypto.createHash('sha256').update(json).digest('hex');
    }
}
