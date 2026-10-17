import { inArray } from "drizzle-orm";
import { Passwords } from "@/lib/auth/password";
import { Database } from "@/lib/db/client";
import { institutions, students, users } from "@/lib/db/schema";

// Fake data only. Idempotent: rows are keyed by unique email/slug and skipped when present.
const DEV_ADMIN = { email: "admin@saludamente.dev", password: "Admin123!", name: "Administradora Dev" };

const INSTITUTIONS = [
  { name: "Universidad Ficticia del Norte", slug: "u-ficticia-norte", contactEmail: "bienestar@ficticia-norte.test" },
  { name: "Colegio Ejemplo Andino", slug: "colegio-ejemplo-andino", contactEmail: "contacto@ejemplo-andino.test" },
];

const STUDENTS = [
  { slug: "u-ficticia-norte", firstName: "Ana", lastName: "Prueba", email: "ana.prueba@ficticia-norte.test", documentId: "1000000001" },
  { slug: "u-ficticia-norte", firstName: "Bruno", lastName: "Demo", email: "bruno.demo@ficticia-norte.test", documentId: "1000000002" },
  { slug: "u-ficticia-norte", firstName: "Carla", lastName: "Ejemplo", email: "carla.ejemplo@ficticia-norte.test", documentId: "1000000003", status: "inactive" as const },
  { slug: "colegio-ejemplo-andino", firstName: "Diego", lastName: "Muestra", email: "diego.muestra@ejemplo-andino.test", documentId: "1000000004" },
  { slug: "colegio-ejemplo-andino", firstName: "Elena", lastName: "Ficticia", email: "elena.ficticia@ejemplo-andino.test", documentId: "1000000005" },
];

async function seed(): Promise<void> {
  const db = Database.get();

  await db
    .insert(users)
    .values({
      email: DEV_ADMIN.email,
      name: DEV_ADMIN.name,
      role: "admin",
      passwordHash: await Passwords.hash(DEV_ADMIN.password),
    })
    .onConflictDoNothing({ target: users.email });

  await db.insert(institutions).values(INSTITUTIONS).onConflictDoNothing({ target: institutions.slug });

  const seeded = await db
    .select({ id: institutions.id, slug: institutions.slug })
    .from(institutions)
    .where(inArray(institutions.slug, INSTITUTIONS.map((institution) => institution.slug)));
  const idBySlug = new Map(seeded.map((institution) => [institution.slug, institution.id]));

  await db
    .insert(students)
    .values(
      STUDENTS.map(({ slug, ...student }) => {
        const institutionId = idBySlug.get(slug);
        if (!institutionId) throw new Error(`Seed institution "${slug}" is missing`);
        return { ...student, institutionId };
      }),
    )
    .onConflictDoNothing({ target: students.email });

  console.log(`Seed listo. Admin: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => Database.close());
