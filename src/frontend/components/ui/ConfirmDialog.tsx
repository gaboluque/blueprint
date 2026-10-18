"use client";

import { useEffect, useId, useRef } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const CANCEL_LABEL = "Cancel";
const PENDING_LABEL = "Processing…";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-slate-600">
          {description}
        </p>
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={pending}>
            {CANCEL_LABEL}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? PENDING_LABEL : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
