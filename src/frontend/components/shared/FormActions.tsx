import { Button } from "@/frontend/components/ui/Button";

type FormActionsProps = {
  submitLabel: string;
  pending: boolean;
  onCancel: () => void;
};

export function FormActions({ submitLabel, pending, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel} disabled={pending}>
        Cancelar
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </div>
  );
}
