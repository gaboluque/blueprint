import { ErrorReporter } from "@/lib/observability/errorReporter";

describe("ErrorReporter", () => {
  afterEach(() => {
    ErrorReporter.set({ report: () => {} });
  });

  it("does nothing by default", () => {
    expect(() => ErrorReporter.report(new Error("boom"), {})).not.toThrow();
  });

  it("forwards the error and context to the configured adapter", () => {
    const report = jest.fn();
    ErrorReporter.set({ report });
    const error = new Error("boom");

    ErrorReporter.report(error, { route: "GET /x" });

    expect(report).toHaveBeenCalledWith(error, { route: "GET /x" });
  });
});
