/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import { AdminSession } from "@/frontend/gateway/session";
import { InstitutionsListPage } from "@/frontend/features/institutions/InstitutionsListPage";
import { institutionListItemDto } from "../../../../factories/dtos";
import {
  installMockRouterUrlSync,
  mockPathname,
  mockRouter,
  setMockSearchParams,
} from "../../../../helpers/nextNavigation";

jest.mock("next/navigation", () => require("../../../../helpers/nextNavigation").createNextNavigationMock());
jest.mock("@/frontend/gateway/institutions", () => ({ AdminInstitutions: { list: jest.fn(), create: jest.fn() } }));
jest.mock("@/frontend/gateway/session", () => ({ AdminSession: { signOut: jest.fn() } }));

const list = jest.mocked(AdminInstitutions.list);

const norte = institutionListItemDto({ id: "a0000000-0000-4000-8000-000000000001", name: "Norte", studentCount: 3 });
const sur = institutionListItemDto({
  id: "a0000000-0000-4000-8000-000000000002",
  name: "Sur",
  slug: "sur",
  status: "archived",
  archivedAt: "2026-02-01T10:00:00.000Z",
});

describe("InstitutionsListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockSearchParams();
    installMockRouterUrlSync();
    mockPathname.current = "/admin/institutions";
    list.mockResolvedValue({ ok: true, data: [norte, sur], pagination: { page: 1, pageSize: 20, total: 2 } });
  });

  it("renders each institution with its student count, status, and detail link", async () => {
    render(<InstitutionsListPage />);

    await screen.findByRole("link", { name: "Norte" });
    const [, norteRow, surRow] = screen.getAllByRole("row");
    expect(within(norteRow as HTMLElement).getByRole("link", { name: "Norte" })).toHaveAttribute(
      "href",
      `/admin/institutions/${norte.id}`,
    );
    expect(within(norteRow as HTMLElement).getByRole("cell", { name: "3" })).toBeInTheDocument();
    expect(within(norteRow as HTMLElement).getByText("Active")).toBeInTheDocument();
    expect(within(surRow as HTMLElement).getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1 · 2 results/)).toBeInTheDocument();
  });

  it("refetches from page 1 when the status filter changes", async () => {
    render(<InstitutionsListPage />);
    await screen.findByRole("link", { name: "Norte" });

    await userEvent.selectOptions(screen.getByLabelText("Status"), "archived");

    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, status: "archived" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/admin/institutions?status=archived", { scroll: false });
  });

  it("loads list state from the URL on first render", async () => {
    setMockSearchParams("status=archived&search=norte");
    list.mockResolvedValue({ ok: true, data: [sur], pagination: { page: 1, pageSize: 20, total: 1 } });

    render(<InstitutionsListPage />);

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ status: "archived", search: "norte", page: 1 })),
    );
    expect(screen.getByLabelText("Search by name or slug")).toHaveValue("norte");
  });

  it("applies the search only when it is submitted", async () => {
    render(<InstitutionsListPage />);
    await screen.findByRole("link", { name: "Norte" });

    await userEvent.type(screen.getByLabelText("Search by name or slug"), "  norte ");
    const callsWhileTyping = list.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(callsWhileTyping).toBe(1);
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "norte", page: 1 }));
  });

  it("shows a load error inline and retries on demand", async () => {
    list.mockResolvedValueOnce({ ok: false, status: 500, error: "We couldn't load institutions." });
    render(<InstitutionsListPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't load institutions.");
    await userEvent.click(within(alert).getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("link", { name: "Norte" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("signs out before sending the user to login when the session expired, so login can't bounce back", async () => {
    jest.mocked(AdminSession.signOut).mockResolvedValue({ ok: true, data: null });
    list.mockResolvedValueOnce({ ok: false, status: 401, error: "Your session expired. Sign in again." });

    render(<InstitutionsListPage />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/admin/login"));
    expect(AdminSession.signOut).toHaveBeenCalled();
    expect(jest.mocked(AdminSession.signOut).mock.invocationCallOrder[0]).toBeLessThan(
      mockRouter.replace.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("doesn't sign out on errors other than 401", async () => {
    list.mockResolvedValueOnce({ ok: false, status: 500, error: "We couldn't load institutions." });

    render(<InstitutionsListPage />);

    await screen.findByRole("alert");
    expect(AdminSession.signOut).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
