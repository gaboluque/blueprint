import type { ReactNode } from "react";
import { Alert } from "@/frontend/components/ui/Alert";
import { Button } from "@/frontend/components/ui/Button";
import { LoadingState } from "./LoadingState";

type ListShellProps = {
  isLoading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function ListShell({ isLoading, hasLoadedOnce, error, onRetry, isEmpty, emptyMessage, children }: ListShellProps) {
  return (
    <div aria-busy={isLoading}>
      {error && (
        <div className="mb-4">
          <Alert
            action={
              <Button variant="secondary" onClick={onRetry}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        </div>
      )}
      {!hasLoadedOnce && isLoading && <LoadingState />}
      {hasLoadedOnce && isEmpty && <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>}
      {hasLoadedOnce && !isEmpty && children}
    </div>
  );
}
