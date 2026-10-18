import { Button } from "@/frontend/components/ui/Button";

type FormActionsProps = {
  submitLabel: string;
  pending: boolean;
  onCancel: () => void;
  formId?: string;
};

export function FormActions({ submitLabel, pending, onCancel, formId }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" form={formId} disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
