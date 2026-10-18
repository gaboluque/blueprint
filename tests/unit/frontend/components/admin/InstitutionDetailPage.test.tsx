/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import { InstitutionDetailPage } from "@/frontend/features/institutions/InstitutionDetailPage";
import { institutionDto } from "../../../../factories/dtos";
import { installMockRouterUrlSync, mockPathname, setMockSearchParams } from "../../../../helpers/nextNavigation";

jest.mock("next/navigation", () => require("../../../../helpers/nextNavigation").createNextNavigationMock());
jest.mock("@/frontend/gateway/session", () => ({ AdminSession: { signOut: jest.fn() } }));
jest.mock("@/frontend/gateway/institutions", () => ({
  AdminInstitutions: {
    get: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    listStudents: jest.fn(),
    createStudent: jest.fn(),
  },
}));

const institution = institutionDto({ name: "Norte" });
const archived = institutionDto({ name: "Norte", status: "archived", archivedAt: "2026-02-01T10:00:00.000Z" });

async function openArchiveDialog() {
  render(<InstitutionDetailPage institutionId={institution.id} />);
  await userEvent.click(await screen.findByRole("button", { name: "Archivar" }));
  return screen.getByRole("alertdialog", { name: "¿Archivar Norte?" });
}

describe("InstitutionDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockSearchParams();
    installMockRouterUrlSync();
    mockPathname.current = `/admin/institutions/${institution.id}`;
    jest.mocked(AdminInstitutions.get).mockResolvedValue({ ok: true, data: institution });
    jest.mocked(AdminInstitutions.listStudents).mockResolvedValue({
      ok: true,
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    });
  });

  it("archives after confirmation and switches the page to read-only", async () => {
    jest.mocked(AdminInstitutions.archive).mockResolvedValue({ ok: true, data: archived });
    const dialog = await openArchiveDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "Archivar" }));

    expect(AdminInstitutions.archive).toHaveBeenCalledWith(institution.id);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await screen.findByText(/Esta institución está archivada/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar estudiante" })).not.toBeInTheDocument();
  });

  it("doesn't archive when the dialog is cancelled", async () => {
    const dialog = await openArchiveDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(AdminInstitutions.archive).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("keeps the dialog open with the error when archiving fails", async () => {
    jest.mocked(AdminInstitutions.archive).mockResolvedValue({
      ok: false,
      status: 409,
      error: "La institución ya está archivada.",
    });
    const dialog = await openArchiveDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "Archivar" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent("La institución ya está archivada.");
    expect(screen.queryByText(/Esta institución está archivada/)).not.toBeInTheDocument();
  });

  it("renders an archived institution without write actions", async () => {
    jest.mocked(AdminInstitutions.get).mockResolvedValue({ ok: true, data: archived });

    render(<InstitutionDetailPage institutionId={archived.id} />);

    expect(await screen.findByText(/Esta institución está archivada/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar estudiante" })).not.toBeInTheDocument();
  });
});
