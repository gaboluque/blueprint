import type { InstitutionProps } from "@/domains/institutions/institution.model";
import { Database } from "@/lib/db/client";
import { institutions } from "@/lib/db/schema";
import { buildArchivedInstitution, buildInstitution } from "@tests/factories/models";
import { IntegrationSequence } from "@tests/integration/factories/sequence";

type CreateInstitutionInput = Partial<
  Pick<InstitutionProps, "name" | "slug" | "contactEmail" | "status" | "archivedAt">
>;

function insertValues(overrides: CreateInstitutionInput): typeof institutions.$inferInsert {
  const seq = IntegrationSequence.next();
  const sample =
    overrides.status === "archived" ? buildArchivedInstitution(overrides) : buildInstitution(overrides);

  const status = overrides.status ?? sample.status;
  return {
    name: overrides.name ?? sample.name,
    slug: overrides.slug ?? `${sample.slug}-${seq}`,
    contactEmail: overrides.contactEmail ?? `inst-${seq}@integration.test`,
    status,
    archivedAt: status === "archived" ? (overrides.archivedAt ?? sample.archivedAt ?? new Date()) : null,
  };
}

async function create(overrides: CreateInstitutionInput = {}) {
  const db = Database.get();
  const [row] = await db.insert(institutions).values(insertValues(overrides)).returning();
  if (!row) throw new Error("InstitutionFactory.create failed");
  return row;
}

export const InstitutionFactory = { create };
