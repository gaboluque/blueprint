import { Button } from "@/frontend/components/ui/Button";
import type { PaginationMeta } from "@/lib/pagination";

type PaginationProps = PaginationMeta & {
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <p>
        Página {page} de {totalPages} · {total} {total === 1 ? "resultado" : "resultados"}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Anterior
        </Button>
        <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
