import { eq, inArray } from "drizzle-orm";
import { Passwords } from "@/lib/auth/password";
import { Database } from "@/lib/db/client";
import { institutionMembers, institutions, students, users } from "@/lib/db/schema";

// Fake data only. Idempotent: rows are keyed by unique email/slug and skipped when present.
const DEV_ADMIN = { email: "admin@blueprint.dev", password: "Admin123!", name: "Dev Admin" };

const NORTH_UNIVERSITY_SLUG = "north-fictional-university";
const ANDEAN_COLLEGE_SLUG = "andean-example-college";

const INSTITUTIONS = [
  {
    name: "North Fictional University",
    slug: NORTH_UNIVERSITY_SLUG,
    contactEmail: "wellness@north-university.test",
  },
  {
    name: "Andean Example College",
    slug: ANDEAN_COLLEGE_SLUG,
    contactEmail: "contact@andean-college.test",
  },
];

const INSTITUTION_STAFF = [
  {
    slug: NORTH_UNIVERSITY_SLUG,
    email: "admin@north-university.test",
    password: "Staff123!",
    name: "North Institution Admin",
    role: "admin" as const,
  },
  {
    slug: NORTH_UNIVERSITY_SLUG,
    email: "teacher@north-university.test",
    password: "Staff123!",
    name: "North Demo Teacher",
    role: "teacher" as const,
  },
];

const STUDENTS = [
  {
    slug: NORTH_UNIVERSITY_SLUG,
    firstName: "Anna",
    lastName: "Sample",
    email: "anna.sample@north-university.test",
    documentId: "1000000001",
  },
  {
    slug: NORTH_UNIVERSITY_SLUG,
    firstName: "Brian",
    lastName: "Demo",
    email: "brian.demo@north-university.test",
    documentId: "1000000002",
  },
  {
    slug: NORTH_UNIVERSITY_SLUG,
    firstName: "Claire",
    lastName: "Example",
    email: "claire.example@north-university.test",
    documentId: "1000000003",
    status: "inactive" as const,
  },
  {
    slug: ANDEAN_COLLEGE_SLUG,
    firstName: "Daniel",
    lastName: "Fixture",
    email: "daniel.fixture@andean-college.test",
    documentId: "1000000004",
  },
  {
    slug: ANDEAN_COLLEGE_SLUG,
    firstName: "Emily",
    lastName: "Fictional",
    email: "emily.fictional@andean-college.test",
    documentId: "1000000005",
  },
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
    .where(
      inArray(
        institutions.slug,
        INSTITUTIONS.map((institution) => institution.slug),
      ),
    );
  const idBySlug = new Map(seeded.map((institution) => [institution.slug, institution.id]));

  for (const member of INSTITUTION_STAFF) {
    const institutionId = idBySlug.get(member.slug);
    if (!institutionId) throw new Error(`Seed institution "${member.slug}" is missing`);

    const [user] = await db
      .insert(users)
      .values({
        email: member.email,
        name: member.name,
        role: "institution_staff",
        passwordHash: await Passwords.hash(member.password),
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    const userId =
      user?.id ?? (await db.select({ id: users.id }).from(users).where(eq(users.email, member.email)))[0]?.id;

    if (!userId) throw new Error(`Seed staff user "${member.email}" is missing`);

    await db
      .insert(institutionMembers)
      .values({ institutionId, userId, role: member.role })
      .onConflictDoNothing({ target: institutionMembers.userId });
  }

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

  console.log(`Seed complete. Admin: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`);
  console.log(
    `Staff (${NORTH_UNIVERSITY_SLUG}): ${INSTITUTION_STAFF.map((m) => `${m.email} / ${m.password}`).join(", ")}`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => Database.close());
