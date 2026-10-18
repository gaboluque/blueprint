"use client";

import { useCallback, useState } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import { useMutation } from "@/frontend/hooks/useMutation";
import { Button, type ButtonProps } from "@/frontend/components/ui/Button";
import { ConfirmDialog } from "@/frontend/components/ui/ConfirmDialog";

type ConfirmActionButtonProps<T> = {
  label: string;
  title: string;
  description: string;
  action: () => Promise<ApiResult<T>>;
  onDone: (data: T) => void;
  icon?: ButtonProps["icon"];
  size?: ButtonProps["size"];
};

/** Destructive action behind a confirmation dialog; errors stay inline in the dialog. */
export function ConfirmActionButton<T>({
  label,
  title,
  description,
  action,
  onDone,
  icon,
  size = "sm",
}: ConfirmActionButtonProps<T>) {
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
      <Button
        variant="danger"
        size={size}
        icon={icon}
        onClick={() => setIsConfirming(true)}
        aria-label={icon ? label : undefined}
      >
        {icon ? undefined : label}
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
