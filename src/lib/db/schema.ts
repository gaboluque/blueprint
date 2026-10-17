import { sql } from "drizzle-orm";
import { check, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const institutionStatus = pgEnum("institution_status", ["active", "archived"]);
export const studentStatus = pgEnum("student_status", ["active", "inactive"]);
export const userRole = pgEnum("user_role", ["admin", "institution_staff"]);
export const institutionMemberRole = pgEnum("institution_member_role", ["admin", "teacher"]);

export type InstitutionStatus = (typeof institutionStatus.enumValues)[number];
export type StudentStatus = (typeof studentStatus.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];
export type InstitutionMemberRole = (typeof institutionMemberRole.enumValues)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRole("role").notNull().default("admin"),
  ...timestamps,
});

export const institutions = pgTable(
  "institutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    contactEmail: text("contact_email").notNull(),
    status: institutionStatus("status").notNull().default("active"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    check(
      "institutions_archived_at_matches_status",
      sql`(${table.status} = 'archived') = (${table.archivedAt} is not null)`,
    ),
  ],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    documentId: text("document_id").notNull(),
    status: studentStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [index("students_institution_id_idx").on(table.institutionId)],
);

export const institutionMembers = pgTable(
  "institution_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: institutionMemberRole("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("institution_members_user_id_unique").on(table.userId),
    uniqueIndex("institution_members_institution_user_unique").on(table.institutionId, table.userId),
    index("institution_members_institution_id_idx").on(table.institutionId),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "restrict" }),
    requestId: text("request_id"),
    changes: jsonb("changes").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index("audit_events_entity_idx").on(table.entityType, table.entityId, table.occurredAt),
    index("audit_events_institution_idx").on(table.institutionId, table.occurredAt),
    index("audit_events_actor_idx").on(table.actorId, table.occurredAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type InstitutionRow = typeof institutions.$inferSelect;
export type StudentRow = typeof students.$inferSelect;
export type InstitutionMemberRow = typeof institutionMembers.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
