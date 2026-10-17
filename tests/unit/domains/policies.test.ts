import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { StudentPolicy } from "@/domains/students/student.policy";
import { buildAdminActor, buildArchivedInstitution, buildInstitution, buildStudent } from "../../factories/models";

describe("InstitutionPolicy", () => {
  it("lets an admin list, create, read, update, archive, and manage students", () => {
    const admin = buildAdminActor();
    const institution = buildInstitution();

    const decisions = [
      InstitutionPolicy.canList(admin),
      InstitutionPolicy.canCreate(admin),
      InstitutionPolicy.canRead(admin, institution),
      InstitutionPolicy.canUpdate(admin, institution),
      InstitutionPolicy.canArchive(admin, institution),
      InstitutionPolicy.canManageStudents(admin, institution),
    ];

    expect(decisions).toEqual([true, true, true, true, true, true]);
  });

  it("still lets an admin read an archived institution", () => {
    expect(InstitutionPolicy.canRead(buildAdminActor(), buildArchivedInstitution())).toBe(true);
  });
});

describe("StudentPolicy", () => {
  it("lets an admin read, update, and deactivate a student", () => {
    const admin = buildAdminActor();
    const student = buildStudent();
    const institution = buildInstitution();

    const decisions = [
      StudentPolicy.canRead(admin, student),
      StudentPolicy.canUpdate(admin, student, institution),
      StudentPolicy.canDeactivate(admin, student, institution),
    ];

    expect(decisions).toEqual([true, true, true]);
  });
});
