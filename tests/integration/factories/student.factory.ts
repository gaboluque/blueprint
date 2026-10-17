import type { StudentProps } from "@/domains/students/student.model";
import { Database } from "@/lib/db/client";
import { students } from "@/lib/db/schema";
import { buildStudent } from "@tests/factories/models";
import { IntegrationSequence } from "@tests/integration/factories/sequence";

type CreateStudentInput = Partial<
  Pick<StudentProps, "institutionId" | "firstName" | "lastName" | "email" | "documentId" | "status">
> & {
  institutionId: string;
};

function insertValues(overrides: CreateStudentInput): typeof students.$inferInsert {
  const seq = IntegrationSequence.next();
  const sample = buildStudent({ ...overrides });

  return {
    institutionId: overrides.institutionId,
    firstName: overrides.firstName ?? sample.firstName,
    lastName: overrides.lastName ?? sample.lastName,
    email: overrides.email ?? `student-${seq}@integration.test`,
    documentId: overrides.documentId ?? `900000${String(seq).padStart(4, "0")}`,
    status: overrides.status ?? sample.status,
  };
}

async function create(overrides: CreateStudentInput) {
  const db = Database.get();
  const [row] = await db.insert(students).values(insertValues(overrides)).returning();
  if (!row) throw new Error("StudentFactory.create failed");
  return row;
}

export const StudentFactory = { create };
