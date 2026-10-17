import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { StudentPolicy } from "@/domains/students/student.policy";
import {
  buildAdminActor,
  buildArchivedInstitution,
  buildInstitution,
  buildInstitutionStaffActor,
  buildStudent,
  INSTITUTION_ID,
} from "../../factories/models";

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

  it("lets institution staff read their institution but not platform-wide actions", () => {
    const institution = buildInstitution();
    const adminStaff = buildInstitutionStaffActor({}, { institutionRole: "admin" });
    const teacher = buildInstitutionStaffActor({}, { institutionRole: "teacher" });
    const otherInstitutionStaff = buildInstitutionStaffActor({ institutionId: "99999999-9999-4999-8999-999999999999" });

    expect(InstitutionPolicy.canRead(adminStaff, institution)).toBe(true);
    expect(InstitutionPolicy.canRead(teacher, institution)).toBe(true);
    expect(InstitutionPolicy.canRead(otherInstitutionStaff, institution)).toBe(false);
    expect(InstitutionPolicy.canList(adminStaff)).toBe(false);
    expect(InstitutionPolicy.canManageStudents(adminStaff, institution)).toBe(true);
    expect(InstitutionPolicy.canManageStudents(teacher, institution)).toBe(false);
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

  it("lets institution staff read students in their institution and admins manage writes", () => {
    const student = buildStudent({ institutionId: INSTITUTION_ID });
    const institution = buildInstitution();
    const adminStaff = buildInstitutionStaffActor({}, { institutionRole: "admin" });
    const teacher = buildInstitutionStaffActor({}, { institutionRole: "teacher" });

    expect(StudentPolicy.canRead(teacher, student)).toBe(true);
    expect(StudentPolicy.canUpdate(teacher, student, institution)).toBe(false);
    expect(StudentPolicy.canUpdate(adminStaff, student, institution)).toBe(true);
  });
});
