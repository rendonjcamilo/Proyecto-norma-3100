import { logger } from '../../utils/logger.js';
import { StoredEvent } from './EventStore.js';

export interface EventSubscriber {
  handle(event: StoredEvent): Promise<void>;
}

/**
 * EventPublisher - Publish-Subscribe pattern for event-driven architecture
 */
export class EventPublisher {
  private subscribers: Map<string, EventSubscriber[]> = new Map();

  /**
   * Subscribe to events of a specific type
   */
  subscribe(eventType: string, subscriber: EventSubscriber): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    this.subscribers.get(eventType)!.push(subscriber);
    logger.info({
      msg: 'Subscriber registered',
      eventType,
      subscriberCount: this.subscribers.get(eventType)!.length,
    });
  }

  /**
   * Subscribe to all events (*)
   */
  subscribeToAll(subscriber: EventSubscriber): void {
    this.subscribe('*', subscriber);
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: StoredEvent): Promise<void> {
    const subscribers = [
      ...(this.subscribers.get(event.eventType) || []),
      ...(this.subscribers.get('*') || []),
    ];

    if (subscribers.length === 0) {
      logger.debug({
        msg: 'No subscribers for event',
        eventType: event.eventType,
      });
      return;
    }

    const results = await Promise.allSettled(
      subscribers.map((subscriber) => {
        try {
          return subscriber.handle(event);
        } catch (err) {
          logger.error({
            msg: 'Error in subscriber',
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      })
    );

    // Log failed subscribers
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      logger.warn({
        msg: `${failed.length} subscribers failed`,
        eventType: event.eventType,
      });
    }
  }

  /**
   * Get number of subscribers for an event type
   */
  getSubscriberCount(eventType: string): number {
    return (this.subscribers.get(eventType) || []).length;
  }

  /**
   * Unsubscribe
   */
  unsubscribe(eventType: string, subscriber: EventSubscriber): void {
    const subs = this.subscribers.get(eventType);
    if (!subs) return;

    const index = subs.indexOf(subscriber);
    if (index > -1) {
      subs.splice(index, 1);
    }
  }
}
