import { buildPageItems } from "@/frontend/components/shared/Pagination";

describe("buildPageItems", () => {
  it("lists every page when total is seven or fewer", () => {
    expect(buildPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows a leading window and ellipsis when near the start", () => {
    expect(buildPageItems(2, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });

  it("shows a trailing window and ellipsis when near the end", () => {
    expect(buildPageItems(19, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });

  it("shows a centered window with both ellipses in the middle", () => {
    expect(buildPageItems(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });
});
