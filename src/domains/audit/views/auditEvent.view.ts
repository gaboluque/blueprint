import type { AuditEvent } from "../auditEvent.model";

/** Wire contract. Dates are ISO 8601 strings. */
export type AuditEventDto = {
  id: string;
  occurredAt: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  institutionId: string | null;
  requestId: string | null;
  changes: Record<string, unknown>;
};

function format(event: AuditEvent): AuditEventDto {
  return {
    id: event.id,
    occurredAt: event.occurredAt.toISOString(),
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    institutionId: event.institutionId,
    requestId: event.requestId,
    changes: event.changes,
  };
}

export const AuditEventView = { format };
