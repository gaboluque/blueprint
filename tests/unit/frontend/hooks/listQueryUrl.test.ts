import { listInstitutionsQuerySchema } from "@/domains/institutions/validations/institution.validation";
import {
  areListQueriesEqual,
  listQueryToSearchParams,
  parseListQueryFromUrl,
} from "@/frontend/hooks/listQueryUrl";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

const DEFAULTS = { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: undefined, status: undefined as "active" | "archived" | undefined };

describe("listQueryUrl", () => {
  it("parses filters and pagination from search params", () => {
    const params = new URLSearchParams("page=2&search=norte&status=archived");

    const query = parseListQueryFromUrl(listInstitutionsQuerySchema, params, DEFAULTS);

    expect(query).toEqual({ page: 2, pageSize: DEFAULT_PAGE_SIZE, search: "norte", status: "archived" });
  });

  it("returns defaults when the URL params are invalid", () => {
    const params = new URLSearchParams("status=deleted&page=0");

    const query = parseListQueryFromUrl(listInstitutionsQuerySchema, params, DEFAULTS);

    expect(query).toEqual(DEFAULTS);
  });

  it("omits default pagination and empty filters from the URL", () => {
    const params = listQueryToSearchParams(
      { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: undefined, status: "active" },
      DEFAULTS,
    );

    expect(params.toString()).toBe("status=active");
  });

  it("compares list queries by value", () => {
    expect(
      areListQueriesEqual(
        { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: "a", status: undefined },
        { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: "a", status: undefined },
      ),
    ).toBe(true);
    expect(
      areListQueriesEqual(
        { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: "a", status: undefined },
        { page: 2, pageSize: DEFAULT_PAGE_SIZE, search: "a", status: undefined },
      ),
    ).toBe(false);
  });
});
