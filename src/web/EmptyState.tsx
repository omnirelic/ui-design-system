// État vide de l'admin de CLP (web/src/admin/ui/EmptyState.tsx) : icône 28 px atténuée, titre 15 px gras, indication 13,5 px, action.
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { DIM, rem } from "./theme";
import { clpText } from "./clp-text";

export type EmptyStateProps = { icon?: IconName; title: string; hint?: string; action?: ReactNode };

export function EmptyState({ icon = "status-info", title, hint, action }: EmptyStateProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: rem(10), padding: `${rem(40)} ${rem(16)}`, textAlign: "center" }}>
      <Icon name={icon} size={28} style={{ color: DIM }} />
      <span style={clpText("body", { strong: true })}>{title}</span>
      {hint && <span style={clpText("small", { muted: true })}>{hint}</span>}
      {action}
    </div>
  );
}
