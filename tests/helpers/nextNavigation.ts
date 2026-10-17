import { useSyncExternalStore } from "react";

/** Stable like Next's real router, so hooks depending on it don't refetch every render. */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

let mockSearchParams = new URLSearchParams();
const searchParamsListeners = new Set<() => void>();

function notifySearchParamsListeners() {
  for (const listener of searchParamsListeners) listener();
}

export function setMockSearchParams(input?: string | URLSearchParams) {
  mockSearchParams = new URLSearchParams(input);
  notifySearchParamsListeners();
}

export function getMockSearchParams(): URLSearchParams {
  return mockSearchParams;
}

export const mockPathname = { current: "/admin/institutions" };

/** Keeps `useListQuery` URL sync working in component tests. */
export function installMockRouterUrlSync() {
  mockRouter.replace.mockImplementation((href: string) => {
    const url = new URL(href, "http://localhost");
    setMockSearchParams(url.searchParams);
  });
}

export function createNextNavigationMock() {
  return {
    useRouter: () => mockRouter,
    usePathname: () => mockPathname.current,
    useSearchParams: () =>
      useSyncExternalStore(
        (onStoreChange) => {
          searchParamsListeners.add(onStoreChange);
          return () => searchParamsListeners.delete(onStoreChange);
        },
        () => mockSearchParams,
        () => mockSearchParams,
      ),
  };
}
