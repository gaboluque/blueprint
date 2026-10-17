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
  await userEvent.type(screen.getByLabelText("Correo electrónico"), email);
  await userEvent.type(screen.getByLabelText("Contraseña"), password);
  await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
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
    signIn.mockResolvedValue({ ok: false, status: 401, error: "Correo o contraseña incorrectos." });
    render(<LoginForm />);

    await submit("admin@ficticia.test", "mala");

    expect(screen.getByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("shows field errors next to the matching input", async () => {
    signIn.mockResolvedValue({
      ok: false,
      status: 400,
      error: "Revisa los datos enviados.",
      fieldErrors: { email: "Ingresa un correo válido." },
    });
    render(<LoginForm />);

    await submit("no-es-correo", "x");

    const email = screen.getByLabelText("Correo electrónico");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Ingresa un correo válido.");
    expect(screen.getByLabelText("Contraseña")).not.toHaveAttribute("aria-invalid");
  });
});
