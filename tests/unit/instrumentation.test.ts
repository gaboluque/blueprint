import { register } from "@/instrumentation";

describe("register", () => {
  it("skips env validation in the edge runtime", async () => {
    process.env.NEXT_RUNTIME = "edge";

    await expect(register()).resolves.toBeUndefined();

    delete process.env.NEXT_RUNTIME;
  });

  it("throws on boot when required env vars are missing", async () => {
    const sessionSecret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    jest.resetModules();

    await expect(register()).rejects.toThrow();

    process.env.SESSION_SECRET = sessionSecret;
  });
});
