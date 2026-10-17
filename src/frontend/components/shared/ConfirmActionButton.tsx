"use client";

import { useCallback, useState } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import { useMutation } from "@/frontend/hooks/useMutation";
import { Button } from "@/frontend/components/ui/Button";
import { ConfirmDialog } from "@/frontend/components/ui/ConfirmDialog";

type ConfirmActionButtonProps<T> = {
  label: string;
  title: string;
  description: string;
  action: () => Promise<ApiResult<T>>;
  onDone: (data: T) => void;
};

/** Destructive action behind a confirmation dialog; errors stay inline in the dialog. */
export function ConfirmActionButton<T>({ label, title, description, action, onDone }: ConfirmActionButtonProps<T>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const mutation = useMutation(action);
  const { reset } = mutation;

  const close = useCallback(() => {
    reset();
    setIsConfirming(false);
  }, [reset]);

  const confirm = async () => {
    const result = await mutation.run(undefined);
    if (!result.ok) return;
    setIsConfirming(false);
    onDone(result.data);
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={isConfirming}
        title={title}
        description={description}
        confirmLabel={label}
        pending={mutation.pending}
        error={mutation.error}
        onConfirm={confirm}
        onCancel={close}
      />
    </>
  );
}
