// Info-bulle au survol/focus — CSS pur scopé par instance (même mécanique
// que LogoMark/Reactive : useId, pas de classe globale à définir côté app
// consommatrice). Pensé pour une icône "i" à côté d'un titre de section,
// jamais pour du texte cliquable (garder `title` natif dans ce cas). `align`
// contrôle l'ancrage horizontal de la bulle — "right" par défaut, l'usage le
// plus fréquent étant une icône en bout de ligne (ex. SectionTitle `action`),
// proche du bord droit du panneau où une bulle centrée déborderait.
import { useId, type ReactNode } from "react";
import { BORDER, CARD, DIM, FONT, TXT } from "./theme";
import { radius } from "../tokens";

export type TooltipAlign = "left" | "center" | "right";
export type TooltipProps = { label: string; children: ReactNode; align?: TooltipAlign };

const ANCHOR: Record<TooltipAlign, { sideStyle: { left?: number | string; right?: number }; transform: string; hoverTransform: string }> = {
  left: { sideStyle: { left: 0 }, transform: "translateY(4px)", hoverTransform: "translateY(0)" },
  center: { sideStyle: { left: "50%" }, transform: "translate(-50%, 4px)", hoverTransform: "translate(-50%, 0)" },
  right: { sideStyle: { right: 0 }, transform: "translateY(4px)", hoverTransform: "translateY(0)" },
};

export function Tooltip({ label, children, align = "right" }: TooltipProps) {
  const gid = useId().replace(/:/g, "");
  const cls = `omni-tooltip-${gid}`;
  const anchor = ANCHOR[align];
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <style>{`
        .${cls} .omni-tooltip-bubble { opacity: 0; visibility: hidden; transform: ${anchor.transform}; transition: opacity 120ms ease, transform 120ms ease; }
        .${cls}:hover .omni-tooltip-bubble, .${cls}:focus-within .omni-tooltip-bubble { opacity: 1; visibility: visible; transform: ${anchor.hoverTransform}; }
      `}</style>
      <span className={cls} tabIndex={0} style={{ display: "inline-flex", color: DIM, cursor: "help", outline: "none" }}>
        {children}
        <span
          className="omni-tooltip-bubble"
          role="tooltip"
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", ...anchor.sideStyle, zIndex: 20, width: 220,
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: radius.sm, padding: "8px 10px",
            fontSize: FONT.caption, fontWeight: 500, lineHeight: 1.4, color: TXT, boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}
