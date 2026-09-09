// Bouton — construit sur Reactive (jamais de hover/active réinventés ici,
// voir Reactive.tsx). variant "primary"/"danger" pleins, "ghost" contour,
// "icon" rond icône seule — mêmes 4 usages déjà couverts par les variantes
// Reactive existantes (primary/ghost/icon), "danger" réutilise la mécanique
// "primary" avec la couleur sémantique danger plutôt que l'accent marque.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Reactive } from "./Reactive";
import { ACCENT, BORDER, CARD, DIM, FONT } from "./theme";
import { semantic, radius } from "../tokens";

export type ButtonVariant = "primary" | "ghost" | "danger" | "icon";
export type ButtonSize = "md" | "sm";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const HEIGHT: Record<ButtonSize, number> = { md: 44, sm: 36 };

export function Button({ variant = "primary", size = "md", loading, disabled, style, children, ...rest }: ButtonProps) {
  const height = HEIGHT[size];
  if (variant === "icon") {
    return (
      <Reactive
        variant="icon"
        disabled={disabled || loading}
        style={{
          width: height, height, borderRadius: "50%", border: `1px solid ${BORDER}`, background: CARD, color: DIM,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: FONT.lg, cursor: disabled || loading ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1, ...style,
        }}
        {...rest}
      >
        {children}
      </Reactive>
    );
  }
  const base = {
    height, borderRadius: radius.md, fontFamily: "inherit", fontSize: size === "sm" ? FONT.body : FONT.base, fontWeight: 800,
    cursor: disabled || loading ? "default" : "pointer", opacity: disabled ? 0.5 : 1, padding: "0 20px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", width: "100%",
  };
  if (variant === "ghost") {
    return (
      <Reactive variant="ghost" disabled={disabled || loading} style={{ ...base, background: "none", border: `1px solid ${BORDER}`, color: DIM, ...style }} {...rest}>
        {loading ? "…" : children}
      </Reactive>
    );
  }
  const fill = variant === "danger" ? semantic.danger : ACCENT;
  return (
    <Reactive
      variant="primary"
      disabled={disabled || loading}
      style={{ ...base, background: variant === "danger" ? "rgba(244,63,94,.12)" : `linear-gradient(135deg, ${fill}, #22b8a0)`, color: variant === "danger" ? semantic.danger : "#04211c", ...style }}
      {...rest}
    >
      {loading ? "…" : children}
    </Reactive>
  );
}
