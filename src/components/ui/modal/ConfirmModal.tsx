"use client";

import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import ModalHeading from "./ModalHeading";

/** Confirmación simple (Tomar lead, bloquear, etc.) — evita window.confirm. */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  variant = "brand",
  error,
  icon,
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
  error?: string;
  icon?: string;
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
        <ModalHeading
          title={title}
          icon={icon ?? "mdi:help-circle-outline"}
          danger={variant === "danger"}
        />
      }
      footer={
        <div className="flex justify-end gap-2 px-5 py-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onClose}
          >
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
      <p className="px-5 pb-2 text-theme-sm text-gray-600 dark:text-gray-300">
        {description}
      </p>
      {error && (
        <p role="alert" className="px-5 pb-3 text-sm text-error-600">
          {error}
        </p>
      )}
    </Modal>
  );
}
