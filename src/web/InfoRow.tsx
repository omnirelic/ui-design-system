import { ACCENT, TXT, DIM2, BORDER, MONO } from "./theme";

export type InfoRowProps = { icon: string; label: string; value: string; href?: string; highlight?: boolean };

export function InfoRow({ icon, label, value, href, highlight }: InfoRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: DIM2, letterSpacing: 1, marginBottom: 2, fontFamily: MONO }}>{label.toUpperCase()}</div>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: ACCENT, textDecoration: "none", wordBreak: "break-all" as const }}>
            {value}
          </a>
        ) : (
          <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? ACCENT : TXT, fontFamily: highlight ? MONO : "inherit", letterSpacing: highlight ? 2 : 0 }}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
