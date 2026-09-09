// Modale générique (backdrop + carte) — utilisée pour "Nouveau QR", l'aperçu
// QR, et tout flux qui interrompt la vue courante. Ferme sur clic backdrop
// ou Échap ; le contenu (body) défile si besoin, header/footer restent fixes.
import { useEffect, type ReactNode } from "react";
import { CARD, BORDER, TXT, DIM, FONT } from "./theme";
import { shades, radius } from "../tokens";
import { Reactive } from "./Reactive";
import { IconX } from "./icons";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: shades.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
    >
      <div style={{ width: "100%", maxWidth: 380, maxHeight: "85vh", display: "flex", flexDirection: "column", background: CARD, border: `1px solid ${BORDER}`, borderRadius: radius.lg + 4, boxShadow: "0 24px 60px rgba(0,0,0,.5)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ fontSize: FONT.base, fontWeight: 800, color: TXT }}>{title}</div>
          <Reactive
            variant="icon"
            onClick={onClose}
            aria-label="Fermer"
            style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "none", color: DIM, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <IconX size={14} />
          </Reactive>
        </div>
        <div style={{ padding: "16px 18px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        {footer && <div style={{ padding: "12px 18px 18px", flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}
