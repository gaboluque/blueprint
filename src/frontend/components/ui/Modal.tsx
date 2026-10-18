"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "./Card";
import { cx } from "./cx";
import { Button } from "@/frontend/components/ui/Button";
import { CloseIcon } from "@/frontend/icons/CloseIcon";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  role?: "dialog" | "alertdialog";
  describedBy?: string;
  panelClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

const OVERLAY_CLASS = "fixed inset-0 z-[100] flex bg-white md:items-center md:justify-center md:bg-slate-900/40 md:p-4";
const PANEL_CLASS =
  "flex h-dvh w-full flex-col overflow-y-auto rounded-none border-0 shadow-none pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] md:h-auto md:max-h-[calc(100dvh-2rem)] md:w-full md:max-w-2xl md:rounded-lg md:border md:shadow-sm";

export function Modal({
  open,
  title,
  onClose,
  closeDisabled = false,
  footer,
  children,
  role = "dialog",
  describedBy,
  panelClassName,
  initialFocusRef,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [portalTarget] = useState<HTMLElement | null>(() => (typeof document === "undefined" ? null : document.body));

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
      );
      firstFocusable?.focus();
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeDisabled, onClose, initialFocusRef]);

  if (!open || !portalTarget) return null;

  return createPortal(
    <div className={OVERLAY_CLASS}>
      <Card
        ref={panelRef}
        title={title}
        titleId={titleId}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={cx(PANEL_CLASS, panelClassName)}
        actions={
          <Button
            size="sm"
            variant="ghost"
            icon={<CloseIcon />}
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close"
          />
        }
        footer={footer}
      >
        {children}
      </Card>
    </div>,
    portalTarget,
  );
}
