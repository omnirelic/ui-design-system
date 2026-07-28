// Header des vues publiques /:ns/:id — logo + lien accueil + partage.
// `homeHref` reste une balise <a> classique (pas de dépendance à un
// routeur particulier — ce package doit rester consommable par n'importe
// quelle app, react-router ou non).
import { LogoMark } from "./LogoMark";
import { CARD, TXT, DIM, BORDER, MONO, BG2 } from "./theme";

function shareUrl(title: string) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title, url });
  else if (typeof navigator !== "undefined") navigator.clipboard?.writeText(url);
}

export type PublicHeaderProps = { title: string; isDesktop: boolean; homeHref?: string };

export function PublicHeader({ title, isDesktop, homeHref = "/" }: PublicHeaderProps) {
  if (isDesktop) {
    return (
      <div style={{ background: CARD, padding: "12px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 10 }}>
        <a href={homeHref} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <LogoMark size={28} />
          <span style={{ fontWeight: 700, color: TXT }}>omnirelic</span>
        </a>
        <button onClick={() => shareUrl(title)} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: DIM, padding: "7px 16px", fontSize: 11, letterSpacing: 1, cursor: "pointer", fontFamily: MONO, borderRadius: 50 }}>
          PARTAGER
        </button>
      </div>
    );
  }
  return (
    <div style={{ background: CARD, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
      <a href={homeHref} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <LogoMark size={24} />
        <span style={{ fontWeight: 700, color: TXT, fontSize: 14 }}>omnirelic</span>
      </a>
      <button onClick={() => shareUrl(title)} style={{ width: 34, height: 34, borderRadius: "50%", background: BG2, border: "none", color: DIM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
    </div>
  );
}
