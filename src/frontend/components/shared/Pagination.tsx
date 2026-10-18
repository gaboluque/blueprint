import { cx } from "@/frontend/components/ui/cx";
import type { PaginationMeta } from "@/lib/pagination";

type PaginationProps = PaginationMeta & {
  onPageChange: (page: number) => void;
};

type PageItem = number | "ellipsis";

export function buildPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (current >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", totalPages];
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden>
      {direction === "left" ? (
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

const controlClass =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8 sm:min-w-8";

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = buildPageItems(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex justify-between sm:justify-end">
      {/* Numbered pages need room per button; collapse to prev/next + a page count below `sm` instead of shrinking targets. */}
      <p className="flex items-center text-sm text-slate-600 sm:hidden" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <ul className="flex list-none items-center gap-1 p-0">
        <li>
          <button
            type="button"
            className={cx(controlClass, "text-slate-600 hover:text-sky-600")}
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronIcon direction="left" />
          </button>
        </li>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} className="hidden min-w-8 text-center text-slate-400 sm:block" aria-hidden>
              …
            </li>
          ) : (
            <li key={item} className="hidden sm:block">
              <button
                type="button"
                className={cx(
                  controlClass,
                  item === page
                    ? "border border-sky-600 font-semibold text-sky-600"
                    : "text-slate-700 hover:text-sky-600",
                )}
                aria-label={item === page ? `Page ${item}, current page` : `Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={cx(controlClass, "text-slate-600 hover:text-sky-600")}
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronIcon direction="right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
