"use client";

import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";

/** Confirmación simple (Tomar lead, bloquear, etc.) — evita window.confirm. */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  variant = "brand",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "brand" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-sm"
      showCloseButton={false}
      header={
        <div className="px-5 pb-1 pt-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 px-5 py-4">
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={variant === "danger" ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="px-5 pb-2 text-theme-sm text-gray-600 dark:text-gray-300">{description}</p>
    </Modal>
  );
}
