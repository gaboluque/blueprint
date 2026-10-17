import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const institutionStatus = pgEnum("institution_status", ["active", "archived"]);
export const studentStatus = pgEnum("student_status", ["active", "inactive"]);
export const userRole = pgEnum("user_role", ["admin"]);

export type InstitutionStatus = (typeof institutionStatus.enumValues)[number];
export type StudentStatus = (typeof studentStatus.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];

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

export type UserRow = typeof users.$inferSelect;
export type InstitutionRow = typeof institutions.$inferSelect;
export type StudentRow = typeof students.$inferSelect;
