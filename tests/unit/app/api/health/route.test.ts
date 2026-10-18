import { GET } from "@/app/(server)/api/health/route";

const mockExecute = jest.fn();

jest.mock("@/lib/db/client", () => ({ Database: { get: () => ({ execute: mockExecute }) } }));
jest.mock("@/lib/observability/logger", () => ({ AppLogger: { get: () => ({ error: jest.fn() }) } }));

beforeEach(() => jest.clearAllMocks());

describe("GET /api/health", () => {
  it("returns 200 when the database responds", async () => {
    mockExecute.mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns 503 when the database check fails", async () => {
    mockExecute.mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "error" });
  });
});
