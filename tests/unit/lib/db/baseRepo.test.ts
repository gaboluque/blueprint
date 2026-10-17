import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { BaseRepo, type AuditSink, type RepoContext, type Row } from "@/lib/db/baseRepo";
import type { DbExecutor } from "@/lib/db/client";

const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  institutionId: uuid("institution_id"),
});

type WidgetRow = Row<typeof widgets>;

class Widget {
  constructor(public readonly row: WidgetRow) {}
}

class WidgetsRepo extends BaseRepo<typeof widgets, Widget> {
  protected readonly table = widgets;
  protected toModel(row: WidgetRow): Widget {
    return new Widget(row);
  }
  protected override institutionIdOf(row: WidgetRow): string | null {
    return row.institutionId;
  }
}

class SilentWidgetsRepo extends WidgetsRepo {
  protected override readonly auditable = false;
}

function makeDb(row: WidgetRow): { db: DbExecutor; returning: jest.Mock } {
  const returning = jest.fn(async () => [row]);
  const db = {
    insert: jest.fn(() => ({ values: jest.fn(() => ({ returning })) })),
    update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ returning })) })) })),
  } as unknown as DbExecutor;
  return { db, returning };
}

const WIDGET_ID = "11111111-1111-4111-8111-111111111111";
const INSTITUTION_ID = "22222222-2222-4222-8222-222222222222";
const row: WidgetRow = { id: WIDGET_ID, name: "Pieza", institutionId: INSTITUTION_ID };

describe("BaseRepo audit decoration", () => {
  it("records a created event with the composed entity type and submitted fields", async () => {
    const { db } = makeDb(row);
    const record = jest.fn();
    const audit: AuditSink = { record };
    const repo = new WidgetsRepo({ db, audit } satisfies RepoContext);

    await repo.create({ name: "Pieza", institutionId: INSTITUTION_ID });

    expect(record).toHaveBeenCalledWith({
      entityType: "widget",
      verb: "created",
      entityId: WIDGET_ID,
      institutionId: INSTITUTION_ID,
      changes: { name: "Pieza", institutionId: INSTITUTION_ID },
    });
  });

  it("records an updated event carrying only the patch keys", async () => {
    const { db } = makeDb({ ...row, name: "Renombrada" });
    const record = jest.fn();
    const repo = new WidgetsRepo({ db, audit: { record } } satisfies RepoContext);

    await repo.update(WIDGET_ID, { name: "Renombrada" });

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ verb: "updated", entityId: WIDGET_ID, changes: { name: "Renombrada" } }),
    );
  });

  it("returns null without recording when update finds no row", async () => {
    const returning = jest.fn(async () => []);
    const db = {
      update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ returning })) })) })),
    } as unknown as DbExecutor;
    const record = jest.fn();
    const repo = new WidgetsRepo({ db, audit: { record } });

    const result = await repo.update(WIDGET_ID, { name: "Fantasma" });

    expect(result).toBeNull();
    expect(record).not.toHaveBeenCalled();
  });

  it("skips the audit sink entirely when the repo opts out", async () => {
    const { db } = makeDb(row);
    const record = jest.fn();
    const repo = new SilentWidgetsRepo({ db, audit: { record } });

    await repo.create({ name: "Pieza", institutionId: INSTITUTION_ID });
    await repo.update(WIDGET_ID, { name: "Renombrada" });

    expect(record).not.toHaveBeenCalled();
  });

  it("defaults institutionIdOf to null when the subclass doesn't override", async () => {
    class RootlessRepo extends BaseRepo<typeof widgets, Widget> {
      protected readonly table = widgets;
      protected toModel(r: WidgetRow): Widget {
        return new Widget(r);
      }
    }
    const { db } = makeDb(row);
    const record = jest.fn();
    const repo = new RootlessRepo({ db, audit: { record } });

    await repo.create({ name: "Pieza", institutionId: INSTITUTION_ID });

    expect(record).toHaveBeenCalledWith(expect.objectContaining({ institutionId: null }));
  });
});
