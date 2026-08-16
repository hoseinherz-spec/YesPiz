import { Injectable, Logger } from "@nestjs/common";

export type AuditEvent = {
  type: string;
  actorUserId?: string;
  targetUserId?: string;
  meta?: Record<string, unknown>;
  at: string;
};

/**
 * Structured security/audit log sink (SEC-002).
 * Persists to stdout as JSON; can be swapped for Mongo later.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger("Audit");
  private readonly ring: AuditEvent[] = [];
  private readonly max = 500;

  record(
    type: string,
    input: {
      actorUserId?: string;
      targetUserId?: string;
      meta?: Record<string, unknown>;
    } = {},
  ) {
    const event: AuditEvent = {
      type,
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      meta: input.meta,
      at: new Date().toISOString(),
    };
    this.ring.push(event);
    if (this.ring.length > this.max) this.ring.shift();
    this.logger.log(JSON.stringify(event));
    return event;
  }

  recent(limit = 50): AuditEvent[] {
    return this.ring.slice(-limit);
  }
}
