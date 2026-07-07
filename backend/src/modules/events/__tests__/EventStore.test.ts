/**
 * EventStore.append — pruebas de aislamiento transaccional de la cadena hash
 * CONCERNS.md §3 "Event Store Has No Explicit TX Isolation for Hash Chain (MEDIUM)"
 */

import { Pool } from 'pg';
import { EventStore } from '../EventStore.js';

type MockClient = {
  query: jest.Mock;
  release: jest.Mock;
};

describe('EventStore.append', () => {
  let mockClient: MockClient;
  let mockPool: Pool;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    } as unknown as Pool;
  });

  it('serializes the append inside BEGIN / per-aggregate advisory lock / COMMIT, in order', async () => {
    const storedRow = {
      id: 'evt-1',
      aggregate_id: 'agg-1',
      aggregate_type: 'assessment',
      event_type: 'response_submitted',
      payload: JSON.stringify({ foo: 'bar' }),
      metadata: JSON.stringify({}),
      user_id: 'user-1',
      previous_event_hash: null,
      event_hash: 'somehash',
      timestamp: new Date(),
    };

    mockClient.query.mockImplementation((sql: string) => {
      if (/pg_advisory_xact_lock/.test(sql)) return Promise.resolve({});
      if (/SELECT event_hash/.test(sql)) return Promise.resolve({ rows: [] });
      if (/INSERT INTO events/.test(sql)) return Promise.resolve({ rows: [storedRow] });
      // BEGIN / COMMIT / ROLLBACK
      return Promise.resolve({});
    });

    const store = new EventStore(mockPool);
    const result = await store.append({
      aggregateId: 'agg-1',
      aggregateType: 'assessment',
      eventType: 'response_submitted',
      payload: { foo: 'bar' },
      userId: 'user-1',
    });

    expect(result.id).toBe('evt-1');

    const calledSql = mockClient.query.mock.calls.map(([sql]: [string]) => sql as string);

    const beginIdx = calledSql.findIndex((sql) => /^\s*BEGIN\s*$/i.test(sql));
    const lockIdx = calledSql.findIndex((sql) => /pg_advisory_xact_lock/.test(sql));
    const selectIdx = calledSql.findIndex((sql) => /SELECT event_hash/.test(sql));
    const insertIdx = calledSql.findIndex((sql) => /INSERT INTO events/.test(sql));
    const commitIdx = calledSql.findIndex((sql) => /^\s*COMMIT\s*$/i.test(sql));

    expect(beginIdx).toBeGreaterThanOrEqual(0);
    expect(lockIdx).toBeGreaterThan(beginIdx);
    expect(selectIdx).toBeGreaterThan(lockIdx);
    expect(insertIdx).toBeGreaterThan(selectIdx);
    expect(commitIdx).toBeGreaterThan(insertIdx);

    // El advisory lock debe estar acotado al aggregateId del evento (lock per-aggregate, no global)
    const lockCall = mockClient.query.mock.calls.find(([sql]: [string]) =>
      /pg_advisory_xact_lock/.test(sql)
    ) as [string, unknown[]];
    expect(lockCall[1]).toEqual(['agg-1']);

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back and still releases the client when the insert fails', async () => {
    mockClient.query.mockImplementation((sql: string) => {
      if (/pg_advisory_xact_lock/.test(sql)) return Promise.resolve({});
      if (/SELECT event_hash/.test(sql)) return Promise.resolve({ rows: [] });
      if (/INSERT INTO events/.test(sql)) return Promise.reject(new Error('insert failed'));
      return Promise.resolve({});
    });

    const store = new EventStore(mockPool);

    await expect(
      store.append({
        aggregateId: 'agg-1',
        aggregateType: 'assessment',
        eventType: 'response_submitted',
        payload: { foo: 'bar' },
      })
    ).rejects.toThrow('insert failed');

    const calledSql = mockClient.query.mock.calls.map(([sql]: [string]) => sql as string);
    const rollbackCalled = calledSql.some((sql) => /^\s*ROLLBACK\s*$/i.test(sql));
    const commitCalled = calledSql.some((sql) => /^\s*COMMIT\s*$/i.test(sql));

    expect(rollbackCalled).toBe(true);
    expect(commitCalled).toBe(false);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
