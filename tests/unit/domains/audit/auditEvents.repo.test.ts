import { AuditEventsRepo, type AuditContext } from "@/domains/audit/auditEvents.repo";
import type { AuditSink, RepoContext } from "@/lib/db/baseRepo";
import type { DbExecutor } from "@/lib/db/client";
import type { auditEvents } from "@/lib/db/schema";
import { buildAdminActor } from "../../../factories/models";

const EVENT_ID = "aaaa1111-1111-4111-8111-111111111111";
const ENTITY_ID = "bbbb2222-2222-4222-8222-222222222222";
const INSTITUTION_ID = "cccc3333-3333-4333-8333-333333333333";

function dbReturning(row: unknown) {
  const returning = jest.fn(async () => [row]);
  const values = jest.fn(() => ({ returning }));
  const insert = jest.fn(() => ({ values }));
  return { db: { insert } as unknown as DbExecutor, insert, values, returning };
}

function row(partial: Partial<typeof auditEvents.$inferSelect> = {}): typeof auditEvents.$inferSelect {
  return {
    id: EVENT_ID,
    occurredAt: new Date("2026-05-01T12:00:00.000Z"),
    actorId: buildAdminActor().id,
    action: "institution.updated",
    entityType: "institution",
    entityId: ENTITY_ID,
    institutionId: INSTITUTION_ID,
    requestId: "req-1",
    changes: {},
    ...partial,
  };
}

const stubSink: AuditSink = { record: async () => undefined };

describe("AuditEventsRepo.record", () => {
  it("writes a row composed from the live context and the entry", async () => {
    const context: AuditContext = { actor: buildAdminActor(), requestId: "req-1" };
    const { db, values } = dbReturning(row());
    const repo = new AuditEventsRepo({ db, audit: stubSink } satisfies RepoContext, () => context);

    await repo.record({
      entityType: "institution",
      verb: "archived",
      entityId: ENTITY_ID,
      institutionId: INSTITUTION_ID,
      changes: { status: "archived" },
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: context.actor.id,
        action: "institution.archived",
        entityType: "institution",
        entityId: ENTITY_ID,
        institutionId: INSTITUTION_ID,
        requestId: "req-1",
        changes: { status: "archived" },
      }),
    );
  });

  it("defaults institutionId and changes when the caller omits them", async () => {
    const context: AuditContext = { actor: buildAdminActor(), requestId: null };
    const { db, values } = dbReturning(row({ institutionId: null, changes: {} }));
    const repo = new AuditEventsRepo({ db, audit: stubSink }, () => context);

    await repo.record({ entityType: "user", verb: "signed_in", entityId: context.actor.id });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.signed_in", institutionId: null, requestId: null, changes: {} }),
    );
  });

  it("throws fail-closed when no audit context is set", async () => {
    const { db, insert } = dbReturning(row());
    const repo = new AuditEventsRepo({ db, audit: stubSink }, () => null);

    const act = repo.record({ entityType: "user", verb: "signed_in", entityId: "x" });

    await expect(act).rejects.toThrow(/Audit context missing/);
    expect(insert).not.toHaveBeenCalled();
  });
});
