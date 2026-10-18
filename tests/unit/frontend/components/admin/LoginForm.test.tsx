/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSession } from "@/frontend/gateway/session";
import { LoginForm } from "@/frontend/components/admin/auth/LoginForm";
import { mockRouter } from "../../../../helpers/nextNavigation";

jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
jest.mock("@/frontend/gateway/session", () => ({ AdminSession: { signIn: jest.fn() } }));

const signIn = jest.mocked(AdminSession.signIn);

async function submit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to institutions after a successful sign-in", async () => {
    signIn.mockResolvedValue({
      ok: true,
      data: { id: "1", email: "admin@ficticia.test", name: "Admin", role: "admin" },
    });
    render(<LoginForm />);

    await submit("admin@ficticia.test", "Secreta123!");

    expect(signIn).toHaveBeenCalledWith({ email: "admin@ficticia.test", password: "Secreta123!" });
    expect(mockRouter.replace).toHaveBeenCalledWith("/admin/institutions");
  });

  it("shows wrong credentials inline and stays on the login page", async () => {
    signIn.mockResolvedValue({ ok: false, status: 401, error: "Incorrect email or password." });
    render(<LoginForm />);

    await submit("admin@ficticia.test", "mala");

    expect(screen.getByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("validates email on the client before calling the API", async () => {
    render(<LoginForm />);

    await submit("no-es-correo", "x");

    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid");
  });

  it("shows server field errors next to the matching input", async () => {
    signIn.mockResolvedValue({
      ok: false,
      status: 400,
      error: "Check the submitted data.",
      fieldErrors: { email: "Invalid email address" },
    });
    render(<LoginForm />);

    await submit("user@example.com", "secret");

    const email = screen.getByLabelText("Email");
    expect(signIn).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Invalid email address");
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid");
  });
});
