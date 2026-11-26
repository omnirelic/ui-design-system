// États des contrôles, UNE seule définition (CLP web/src/ui/controls.css : classes `.clp-btn*`) : hover, focus clavier, disabled.
// Interne au paquet (non exporté) : Drawer, ConfirmDialog et CopyButton s'en servent comme CLP se sert de ActionButton / `.clp-btn`.
// Couleurs = jetons du thème (var(--o-*) avec repli sur le jeton brut) ; tailles, paddings et durées identiques à CLP.
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { ACCENT, BG, BG2, BORDER, DIM, MONO, TXT, rem } from "./theme";
import { Spinner } from "./Spinner";
import { toneColor } from "./pastille-model";

/** Voile et ombres : noir neutre, pas une couleur de thème. */
export const VEIL = "rgba(0,0,0,0.6)";
export const SHADOW_DRAWER = "-24px 0 60px rgba(0,0,0,0.55)";
/** Étages de CLP (tokens.ts `Z`). */
export const Z = { sticky: 10, drawer: 1200, modal: 1300 } as const;

/** Teinte translucide d'une couleur du thème : remplace le suffixe hexadécimal de CLP (`G + "22"`), impossible sur `var(...)`. */
export const tint = (color: string, pct: number): string => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const DANGER = toneColor("danger");

export const CONTROLS_CSS = `
.omni-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;box-sizing:border-box;font-family:${MONO};line-height:1;letter-spacing:0.04em;border-radius:4px;cursor:pointer;outline:none;transition:background .15s ease,border-color .15s ease,color .15s ease,opacity .15s ease}
.omni-btn:disabled{cursor:not-allowed;opacity:.45}
.omni-btn:focus-visible{box-shadow:0 0 0 2px ${tint(ACCENT, 40)}}
.omni-btn--ghost{background:transparent;color:${DIM};border:1px solid ${BORDER}}
.omni-btn--ghost:hover:not(:disabled){background:${BG2};color:${TXT};border-color:${ACCENT}}
.omni-btn--primary{background:${ACCENT};color:${BG};border:1px solid ${ACCENT};font-weight:700}
.omni-btn--primary:hover:not(:disabled){filter:brightness(1.1)}
.omni-btn--danger{background:transparent;color:${DANGER};border:1px solid ${BORDER}}
.omni-btn--danger:hover:not(:disabled){background:${tint(DANGER, 10)};border-color:${DANGER}}
.omni-btn--bare{background:transparent;color:${DIM};border:1px solid transparent;padding:4px}
.omni-btn--bare:hover:not(:disabled){color:${TXT}}
.omni-drawer-actions:empty{display:none!important}
`;

// Posée une fois dans <head> au chargement du module (comme le keyframe des squelettes de CLP) : aucun <style> dans le DOM des boutons.
if (typeof document !== "undefined" && !document.getElementById("omni-controls")) {
  const style = document.createElement("style");
  style.id = "omni-controls";
  style.textContent = CONTROLS_CSS;
  document.head.appendChild(style);
}

export type ControlVariant = "ghost" | "primary" | "danger" | "bare";
type Size = "sm" | "md" | "raw";

// Tailles d'ActionButton de CLP : sm 5/9 px, 12 px ; md 7/12 px, 13,5 px ; minHeight 30 px. « raw » : le padding de la variante (bare : 4 px) et la taille du parent.
const SIZE: Record<Exclude<Size, "raw">, CSSProperties> = {
  sm: { padding: `${rem(5)} ${rem(9)}`, fontSize: rem(12), minHeight: rem(30) },
  md: { padding: `${rem(7)} ${rem(12)}`, fontSize: rem(13.5), minHeight: rem(30) },
};

export type ControlButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
  variant?: ControlVariant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
};

export function ControlButton({ variant = "ghost", size = "md", loading, icon, children, style, disabled, type = "button", className, ...rest }: ControlButtonProps) {
  const iconOnly = icon != null && children == null;
  const base: CSSProperties = size === "raw" ? {} : { ...SIZE[size], ...(iconOnly ? { padding: size === "sm" ? `${rem(4)} ${rem(6)}` : `${rem(6)} ${rem(8)}` } : null) };
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`omni-btn omni-btn--${variant}${className ? ` ${className}` : ""}`} style={{ ...base, ...style }} {...rest}>
      {loading ? <Spinner size={12} /> : icon}{children}
    </button>
  );
}
