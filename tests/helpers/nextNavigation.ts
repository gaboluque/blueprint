/** Stable like Next's real router, so hooks depending on it don't refetch every render. */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};
