import { applyIntegrationEnv, DEFAULT_INTEGRATION_DATABASE_URL } from "@tests/integration/integrationEnv";

describe("applyIntegrationEnv", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousIntegrationUrl = process.env.INTEGRATION_DATABASE_URL;

  afterEach(() => {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousIntegrationUrl === undefined) delete process.env.INTEGRATION_DATABASE_URL;
    else process.env.INTEGRATION_DATABASE_URL = previousIntegrationUrl;
  });

  it("overrides dev DATABASE_URL from .env", () => {
    process.env.DATABASE_URL = "postgres://blueprint:blueprint@localhost:5434/blueprint";
    delete process.env.INTEGRATION_DATABASE_URL;

    applyIntegrationEnv();

    expect(process.env.DATABASE_URL).toBe(DEFAULT_INTEGRATION_DATABASE_URL);
  });
});
