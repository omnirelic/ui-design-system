// Pastille omnirelic : UN composant, cinq variantes (compteur, statut, donnée, filtre, point). Concept réseau :
// les cuisines le consomment, elles ne redessinent pas leurs propres pastilles. Tons sémantiques de tokens.ts ;
// le ton « brand » suit --o-accent (thème de la cuisine). Thème clair/sombre par les variables --o-* du consommateur.
import { Fragment, useId, type ReactNode } from "react";
import { FONT } from "./theme";
import { radius } from "../tokens";
import { formatCount, toneColor, type PastilleTone } from "./pastille-model";

export type PastilleSize = "sm" | "md";
const HEIGHT: Record<PastilleSize, string> = { sm: "1.25rem", md: "1.5rem" };
const PAD: Record<PastilleSize, string> = { sm: "0 0.4375rem", md: "0 0.625rem" };

const tint = (tone: PastilleTone, pct: number) => `color-mix(in srgb, ${toneColor(tone)} ${pct}%, transparent)`;

export type PastilleProps =
  | { variant: "count"; value: number | null | undefined; max?: number; tone?: PastilleTone; size?: PastilleSize }
  | { variant: "status"; label: string; tone?: PastilleTone; size?: PastilleSize }
  | { variant: "data"; segments: ReactNode[]; tone?: PastilleTone; size?: PastilleSize }
  | { variant: "filter"; label: string; onRemove: () => void; removeLabel?: string; tone?: PastilleTone; size?: PastilleSize }
  | { variant: "dot"; label: string; tone?: PastilleTone };

const base = { display: "inline-flex", alignItems: "center", boxSizing: "border-box", whiteSpace: "nowrap", lineHeight: 1, fontWeight: 700 } as const;

export function Pastille(props: PastilleProps) {
  const id = useId().replace(/:/g, "");
  if (props.variant === "count") {
    const text = formatCount(props.value, props.max);
    if (text === null) return null;
    const size = props.size ?? "sm", tone = props.tone ?? "danger";
    return (
      <span data-pastille="count" style={{ ...base, justifyContent: "center", minWidth: HEIGHT[size], height: HEIGHT[size], padding: "0 0.3125rem", borderRadius: radius.pill, fontSize: FONT.caption, background: toneColor(tone), color: "var(--o-on-tone, #0a0a0b)" }}>{text}</span>
    );
  }
  if (props.variant === "dot") {
    return <span data-pastille="dot" role="img" aria-label={props.label} style={{ display: "inline-block", width: "0.625rem", height: "0.625rem", borderRadius: "50%", background: toneColor(props.tone ?? "danger") }} />;
  }
  const size = props.size ?? "md";
  if (props.variant === "status") {
    const tone = props.tone ?? "neutral";
    return (
      <span data-pastille="status" data-tone={tone} style={{ ...base, gap: "0.375rem", height: HEIGHT[size], padding: PAD[size], borderRadius: radius.pill, fontSize: FONT.label, color: toneColor(tone), background: tint(tone, 12), border: `1px solid ${tint(tone, 40)}` }}>
        <span aria-hidden style={{ width: "0.4375rem", height: "0.4375rem", borderRadius: "50%", background: "currentColor" }} />
        {props.label}
      </span>
    );
  }
  if (props.variant === "data") {
    const tone = props.tone ?? "neutral";
    return (
      <span data-pastille="data" style={{ ...base, gap: "0.4rem", height: HEIGHT[size], padding: PAD[size], borderRadius: radius.pill, fontSize: FONT.label, fontWeight: 600, color: "var(--o-txt, #e9e9ec)", background: "var(--o-card, #141417)", border: `1px solid ${tint(tone === "neutral" ? "neutral" : tone, 40)}` }}>
        {props.segments.map((s, i) => (
          <Fragment key={i}>{i > 0 && <span aria-hidden style={{ color: "var(--o-border, #26262b)" }}>|</span>}<span>{s}</span></Fragment>
        ))}
      </span>
    );
  }
  const tone = props.tone ?? "brand";
  const cls = `pst-${id}`;
  return (
    <span data-pastille="filter" className={cls} style={{ ...base, gap: "0.25rem", height: HEIGHT[size], padding: "0 0.25rem 0 0.625rem", borderRadius: radius.pill, fontSize: FONT.label, color: toneColor(tone), background: tint(tone, 14), border: `1px solid ${tint(tone, 45)}` }}>
      <style>{`.${cls} button{transition:background 140ms ease}.${cls} button:hover{background:${tint(tone, 28)}}.${cls} button:focus-visible{outline:2px solid currentColor;outline-offset:1px}`}</style>
      {props.label}
      <button type="button" onClick={props.onRemove} aria-label={props.removeLabel ?? `Retirer ${props.label}`} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1rem", height: "1rem", borderRadius: "50%", fontSize: FONT.label }}>
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
    </span>
  );
}
