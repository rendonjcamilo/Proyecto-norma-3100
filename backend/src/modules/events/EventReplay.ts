import { logger } from '../../utils/logger.js';
import { EventStore, StoredEvent } from './EventStore.js';

/**
 * EventReplay - Reconstruct aggregate state from event history
 */
export class EventReplay {
  constructor(private eventStore: EventStore) {}

  /**
   * Replay all events for an aggregate to reconstruct its state
   */
  async replayAggregate<T>(aggregateId: string): Promise<T> {
    const events = await this.eventStore.getEventsByAggregateId(aggregateId);

    if (events.length === 0) {
      logger.warn({
        msg: 'No events found for aggregate',
        aggregateId,
      });
      return {} as T;
    }

    const state = this.applyEvents({} as T, events);

    logger.info({
      msg: 'Aggregate replayed',
      aggregateId,
      eventCount: events.length,
    });

    return state;
  }

  /**
   * Replay all events in the system
   */
  async replayAll(): Promise<Map<string, unknown>> {
    const events = await this.eventStore.getAllEvents();

    const stateByAggregate = new Map<string, unknown>();

    for (const event of events) {
      const aggregateId = event.aggregateId;
      let state = stateByAggregate.get(aggregateId) || ({} as Record<string, unknown>);

      state = this.applyEvent(state as Record<string, unknown>, event);
      stateByAggregate.set(aggregateId, state);
    }

    logger.info({
      msg: 'Full replay completed',
      aggregateCount: stateByAggregate.size,
      eventCount: events.length,
    });

    return stateByAggregate;
  }

  /**
   * Apply a sequence of events to initial state
   */
  private applyEvents<T>(state: T, events: StoredEvent[]): T {
    return events.reduce((acc: Record<string, unknown>, event: StoredEvent) => this.applyEvent(acc, event), state as Record<string, unknown>) as T;
  }

  /**
   * Apply a single event to state
   * Routes to specific handler based on event type
   */
  private applyEvent(state: Record<string, unknown>, event: StoredEvent): Record<string, unknown> {
    switch (event.eventType) {
      case 'provider.created':
        return this.applyProviderCreated(state, event);
      case 'provider.updated':
        return this.applyProviderUpdated(state, event);
      case 'provider.status_changed':
        return this.applyProviderStatusChanged(state, event);
      case 'finding.created':
        return this.applyFindingCreated(state, event);
      case 'finding.status_changed':
        return this.applyFindingStatusChanged(state, event);
      case 'action.created':
        return this.applyActionCreated(state, event);
      case 'action.status_changed':
        return this.applyActionStatusChanged(state, event);
      default:
        logger.debug({
          msg: 'Unknown event type, no state change',
          eventType: event.eventType,
        });
        return state;
    }
  }

  private applyProviderCreated(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    return {
      ...state,
      id: event.aggregateId,
      ...event.payload,
      createdAt: event.timestamp,
    };
  }

  private applyProviderUpdated(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    return {
      ...state,
      ...event.payload,
      updatedAt: event.timestamp,
    };
  }

  private applyProviderStatusChanged(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    return {
      ...state,
      status: (event.payload).status,
      statusChangedAt: event.timestamp,
    };
  }

  private applyFindingCreated(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    const findings = (state.findings as Record<string, unknown>[]) || [];
    return {
      ...state,
      findings: [
        ...findings,
        {
          id: event.aggregateId,
          ...event.payload,
          createdAt: event.timestamp,
        },
      ],
    };
  }

  private applyFindingStatusChanged(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    const findings = (state.findings as Array<Record<string, unknown>>) || [];
    return {
      ...state,
      findings: findings.map((f) =>
        f.id === event.aggregateId
          ? { ...f, status: (event.payload).status }
          : f
      ),
    };
  }

  private applyActionCreated(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    const actions = (state.actions as Record<string, unknown>[]) || [];
    return {
      ...state,
      actions: [
        ...actions,
        {
          id: event.aggregateId,
          ...event.payload,
          createdAt: event.timestamp,
        },
      ],
    };
  }

  private applyActionStatusChanged(
    state: Record<string, unknown>,
    event: StoredEvent
  ): Record<string, unknown> {
    const actions = (state.actions as Array<Record<string, unknown>>) || [];
    return {
      ...state,
      actions: actions.map((a) =>
        a.id === event.aggregateId
          ? { ...a, status: (event.payload).status }
          : a
      ),
    };
  }
}
