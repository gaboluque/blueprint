import type { Actor } from "@/lib/auth/actor";
import { BaseRepo, type AuditEntry, type RepoContext, type Row } from "@/lib/db/baseRepo";
import { auditEvents } from "@/lib/db/schema";
import type { PaginationQuery, PaginationResult } from "@/lib/pagination";
import { AuditEvent } from "./auditEvent.model";

export type AuditContext = {
  actor: Actor;
  requestId: string | null;
};

export class AuditEventsRepo extends BaseRepo<typeof auditEvents, AuditEvent> {
  protected readonly table = auditEvents;
  /** Prevents the base-repo decorator from auditing audit writes. */
  protected override readonly auditable = false;

  constructor(context: RepoContext, private readonly getContext: () => AuditContext | null) {
    super(context);
  }

  protected toModel(row: Row<typeof auditEvents>): AuditEvent {
    return new AuditEvent(row);
  }

  /** Shared write path used by the base-repo decorator and by non-row events (sign-in, sign-out). */
  async record(entry: AuditEntry): Promise<AuditEvent> {
    const ctx = this.getContext();
    if (!ctx) throw new Error("Audit context missing: cannot record event without an actor");
    return this.create({
      actorId: ctx.actor.id,
      action: `${entry.entityType}.${entry.verb}`,
      entityType: entry.entityType,
      entityId: entry.entityId,
      institutionId: entry.institutionId ?? null,
      requestId: ctx.requestId,
      changes: entry.changes ?? {},
    });
  }

  /** Timeline for one entity, newest first. */
  listByEntity(entityType: string, entityId: string, page: PaginationQuery): Promise<PaginationResult<AuditEvent>> {
    return this.paginate(
      { entityType, entityId },
      { page: page.page, pageSize: page.pageSize, orderBy: { occurredAt: "desc" } },
    );
  }
}
