// CopyButton de l'admin de CLP (web/src/admin/ui/CopyButton.tsx) : LE bouton « copier ». Icône → coche + « Copié » pendant 1,8 s.
// Le texte peut être une fonction, évaluée au clic. Ne propage pas le clic (cartes cliquables). Plus CopyTextButton (texte généré au clic).
// Écart : le tooltip est le `title` natif (le Tooltip omnirelic ajouterait un arrêt de tabulation autour du bouton).
import type { CSSProperties, MouseEvent } from "react";
import { Icon, type IconName } from "./Icon";
import { ControlButton, type ControlVariant } from "./controls";
import { toneColor } from "./pastille-model";
import { tint } from "./controls";
import { useCopied } from "./useCopied";

export type CopyButtonProps = {
  text: string | (() => string | Promise<string>);
  /** Obligatoire pour une icône seule ; inutile quand un libellé est visible. */
  tooltip?: string;
  /** Libellé visible ; sans libellé, bouton icône seule. */
  label?: string;
  /** Icône au repos (« copier » par défaut). */
  icon?: IconName;
  variant?: ControlVariant;
  disabled?: boolean;
  /** Tooltip quand le bouton est désactivé (sinon `tooltip`). */
  disabledTooltip?: string;
  /** Pleine largeur : icône + libellé à gauche, coche de confirmation à droite une fois copié. */
  wide?: boolean;
  /** Avec `wide` : l'icône « copier » à droite du libellé, remplacée par la coche une fois copié. */
  trailing?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function CopyButton({ text, tooltip, label, icon = "action-copy", variant, disabled, disabledTooltip, wide, trailing, size = 14, className, style }: CopyButtonProps) {
  const { copied, copy } = useCopied();
  const onClick = (e: MouseEvent) => { e.stopPropagation(); void copy(typeof text === "function" ? text() : text); };
  const success = toneColor("success");
  const tone: CSSProperties = copied ? { color: success, borderColor: tint(success, 40) } : {};

  if (wide && label) {
    return (
      <ControlButton title={disabled ? (disabledTooltip ?? tooltip) : tooltip} aria-label={tooltip ?? label} disabled={disabled} variant={variant ?? "ghost"} onClick={onClick} className={className}
        style={{ justifyContent: "flex-start", gap: 8, minHeight: 32, padding: "0 10px", width: "100%", ...tone, ...style }}>
        <Icon name={icon} size={size} />
        <span style={{ flex: 1, textAlign: "left" }}>{copied ? "Copié" : label}</span>
        {copied ? <Icon name="status-check" size={size} /> : trailing && <Icon name="action-copy" size={size} />}
      </ControlButton>
    );
  }
  if (label) {
    return (
      <ControlButton title={tooltip} disabled={disabled} variant={variant ?? "ghost"} onClick={onClick} style={{ ...tone, ...style }} icon={<Icon name={copied ? "status-check" : icon} size={size} />}>
        {copied ? "Copié" : label}
      </ControlButton>
    );
  }
  const tip = disabled ? (disabledTooltip ?? tooltip ?? "Copier") : copied ? "Copié" : (tooltip ?? "Copier");
  return (
    <ControlButton title={tip} aria-label={tip} disabled={disabled} variant={variant ?? "bare"} onClick={onClick} className={`omni-copy-icon${copied ? " omni-copied" : ""}${className ? ` ${className}` : ""}`} style={{ ...tone, ...style }}
      icon={<Icon name={copied ? "status-check" : icon} size={size} />} />
  );
}

/** Bouton « copier un texte généré » : le texte est construit au clic (jamais figé au rendu). Alias de CopyButton. */
export function CopyTextButton({ label, tooltip, getText }: { label: string; tooltip?: string; getText: () => string }) {
  return <CopyButton label={label} tooltip={tooltip ?? label} text={getText} size={13} />;
}
