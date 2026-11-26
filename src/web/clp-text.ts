// Styles de texte de l'admin de CLP (web/src/admin/ui/Text.tsx + tokens.ts `TYPE`), repris pour DataTable, Pager et EmptyState :
// caption 12 px, small 13,5 px, body 15 px ; ton « muted » = DIM. Interne au paquet (non exporté).
import type { CSSProperties } from "react";
import { DIM, MONO, TXT, rem } from "./theme";

const SIZE = { caption: rem(12), small: rem(13.5), body: rem(15) } as const;

export function clpText(variant: keyof typeof SIZE, opts: { muted?: boolean; strong?: boolean; label?: boolean } = {}): CSSProperties {
  return {
    fontFamily: MONO, fontSize: SIZE[variant], color: opts.muted ? DIM : TXT, fontWeight: opts.strong ? 700 : 400,
    ...(opts.label ? { textTransform: "uppercase", letterSpacing: "0.1em" } : null),
  };
}
