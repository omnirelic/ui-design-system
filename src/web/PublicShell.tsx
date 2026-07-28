import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { BG, BORDER } from "./theme";

export type PublicShellProps = {
  isDesktop: boolean;
  title: string;
  hero: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
  homeHref?: string;
};

// Layout 2 colonnes desktop / empilé mobile, commun à toute vue publique
// /:ns/:id — hero pleine largeur, puis contenu principal (+ sidebar
// optionnelle). Utilisé par LocationPage (/q) et les templates o/k/b/v/p.
export function PublicShell({ isDesktop, title, hero, main, sidebar, homeHref }: PublicShellProps) {
  if (isDesktop) {
    return (
      <div style={{ background: BG, minHeight: "100vh", fontFamily: "var(--font-body, Inter), sans-serif" }}>
        <PublicHeader title={title} isDesktop homeHref={homeHref} />
        <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
          <div style={{ borderRadius: "0 0 12px 12px", overflow: "hidden", border: `1px solid ${BORDER}`, borderTop: "none" }}>{hero}</div>
          {sidebar ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12, marginTop: 12 }}>
              <div>{main}</div>
              <div>{sidebar}</div>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>{main}</div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "var(--font-body, Inter), sans-serif" }}>
      <PublicHeader title={title} isDesktop={false} homeHref={homeHref} />
      <div>{hero}</div>
      <div style={{ padding: "12px 12px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        {main}
        {sidebar}
      </div>
    </div>
  );
}
