// Alert de CLP (web/src/ui/Alert.tsx) : bandeau 4 types, icône de statut, message, × optionnel. Couleurs = tons du thème.
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { toneColor, type PastilleTone } from "./pastille-model";
import { MONO, rem } from "./theme";
import { tint } from "./controls";

export type AlertType = "success" | "warning" | "error" | "info";
export type AlertProps = { type: AlertType; message: ReactNode; onClose?: () => void };

const CONFIG: Record<AlertType, { tone: PastilleTone; icon: IconName }> = {
  success: { tone: "success", icon: "status-success" },
  warning: { tone: "warning", icon: "status-warning" },
  error: { tone: "danger", icon: "status-error" },
  info: { tone: "brand", icon: "status-info" }, // CLP : l'info prend l'accent de la marque (or), pas un bleu
};

export function Alert({ type, message, onClose }: AlertProps) {
  const cfg = CONFIG[type];
  const color = toneColor(cfg.tone);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: tint(color, 9), border: `1px solid ${tint(color, 27)}`, borderRadius: 6, padding: "10px 14px", fontSize: rem(11), fontFamily: MONO, color }}>
      <span style={{ flexShrink: 0, display: "inline-flex", paddingTop: 1 }}><Icon name={cfg.icon} color="currentColor" weight="bold" size={15} /></span>
      <span style={{ flex: 1, lineHeight: 1.6 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", color, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}>
          <Icon name="action-close" size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}
