// ConfirmDialog de l'admin de CLP (web/src/admin/ui/ConfirmDialog.tsx) : modale 420 px, message, Annuler + action (primaire ou danger, état chargement).
import { Modal } from "./Modal";
import { ControlButton } from "./controls";
import { DIM, MONO, rem } from "./theme";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  /** À relever quand la confirmation s'ouvre depuis un tiroir (z-index 1200) : sinon elle s'affiche dessous. */
  zIndex?: number;
  /** Bouton qui prend le focus à l'ouverture : Entrée l'active nativement. Rien par défaut. */
  initialFocus?: "confirm" | "cancel";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirmer", danger, loading, zIndex, initialFocus, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth={420} zIndex={zIndex}>
      <p style={{ margin: 0, lineHeight: 1.6, fontFamily: MONO, fontSize: rem(15), color: DIM }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: rem(8), marginTop: rem(20), flexWrap: "wrap" }}>
        <ControlButton autoFocus={initialFocus === "cancel"} onClick={onCancel}>Annuler</ControlButton>
        <ControlButton variant={danger ? "danger" : "primary"} autoFocus={initialFocus === "confirm"} loading={loading} onClick={onConfirm}>{confirmLabel}</ControlButton>
      </div>
    </Modal>
  );
}
