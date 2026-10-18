import { eq, inArray } from "drizzle-orm";
import { Passwords } from "@/lib/auth/password";
import { Database } from "@/lib/db/client";
import { institutionMembers, institutions, students, users } from "@/lib/db/schema";

// Fake data only. Idempotent: rows are keyed by unique email and skipped when present.
const DEV_ADMIN = { email: "admin@blueprint.dev", password: "Admin123!", name: "Dev Admin" };

const NORTH_UNIVERSITY_EMAIL = "wellness@north-university.test";
const ANDEAN_COLLEGE_EMAIL = "contact@andean-college.test";

const INSTITUTIONS = [
  {
    name: "North Fictional University",
    contactEmail: NORTH_UNIVERSITY_EMAIL,
  },
  {
    name: "Andean Example College",
    contactEmail: ANDEAN_COLLEGE_EMAIL,
  },
];

const INSTITUTION_STAFF = [
  {
    institutionContactEmail: NORTH_UNIVERSITY_EMAIL,
    email: "admin@north-university.test",
    password: "Staff123!",
    name: "North Institution Admin",
    role: "admin" as const,
  },
  {
    institutionContactEmail: NORTH_UNIVERSITY_EMAIL,
    email: "teacher@north-university.test",
    password: "Staff123!",
    name: "North Demo Teacher",
    role: "teacher" as const,
  },
];

const STUDENTS = [
  {
    institutionContactEmail: NORTH_UNIVERSITY_EMAIL,
    firstName: "Anna",
    lastName: "Sample",
    email: "anna.sample@north-university.test",
    documentId: "1000000001",
  },
  {
    institutionContactEmail: NORTH_UNIVERSITY_EMAIL,
    firstName: "Brian",
    lastName: "Demo",
    email: "brian.demo@north-university.test",
    documentId: "1000000002",
  },
  {
    institutionContactEmail: NORTH_UNIVERSITY_EMAIL,
    firstName: "Claire",
    lastName: "Example",
    email: "claire.example@north-university.test",
    documentId: "1000000003",
    status: "inactive" as const,
  },
  {
    institutionContactEmail: ANDEAN_COLLEGE_EMAIL,
    firstName: "Daniel",
    lastName: "Fixture",
    email: "daniel.fixture@andean-college.test",
    documentId: "1000000004",
  },
  {
    institutionContactEmail: ANDEAN_COLLEGE_EMAIL,
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

  for (const institution of INSTITUTIONS) {
    const [existing] = await db
      .select({ id: institutions.id })
      .from(institutions)
      .where(eq(institutions.contactEmail, institution.contactEmail))
      .limit(1);
    if (!existing) {
      await db.insert(institutions).values(institution);
    }
  }

  const seeded = await db
    .select({ id: institutions.id, contactEmail: institutions.contactEmail })
    .from(institutions)
    .where(
      inArray(
        institutions.contactEmail,
        INSTITUTIONS.map((item) => item.contactEmail),
      ),
    );
  const idByContactEmail = new Map(seeded.map((institution) => [institution.contactEmail, institution.id]));

  for (const member of INSTITUTION_STAFF) {
    const institutionId = idByContactEmail.get(member.institutionContactEmail);
    if (!institutionId) throw new Error(`Seed institution "${member.institutionContactEmail}" is missing`);

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
      STUDENTS.map(({ institutionContactEmail, ...student }) => {
        const institutionId = idByContactEmail.get(institutionContactEmail);
        if (!institutionId) throw new Error(`Seed institution "${institutionContactEmail}" is missing`);
        return { ...student, institutionId };
      }),
    )
    .onConflictDoNothing({ target: students.email });

  console.log(`Seed complete. Admin: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`);
  console.log(
    `Staff (${NORTH_UNIVERSITY_EMAIL}): ${INSTITUTION_STAFF.map((m) => `${m.email} / ${m.password}`).join(", ")}`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => Database.close());
