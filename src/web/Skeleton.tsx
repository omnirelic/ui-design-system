// Squelettes de l'admin de CLP (web/src/admin/ui/Skeleton.tsx) : barre, lignes, tableau, grille, bandeau ; reflet qui glisse en 1,4 s.
// Fonds = CARD / BORDER du thème (CLP : #1a1a1a / #2a2a2a). Le keyframe est posé une fois dans <head> comme chez CLP.
import type { CSSProperties } from "react";
import { BORDER, CARD } from "./theme";

if (typeof document !== "undefined" && !document.getElementById("omni-sk")) {
  const s = document.createElement("style");
  s.id = "omni-sk";
  s.textContent = `@keyframes omni-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`;
  document.head.appendChild(s);
}

const BASE: CSSProperties = {
  background: `linear-gradient(90deg,${CARD} 25%,${BORDER} 50%,${CARD} 75%)`,
  backgroundSize: "800px 100%",
  animation: "omni-shimmer 1.4s ease-in-out infinite",
  borderRadius: 4,
};

export function Sk({ w = "100%", h = 14, r = 4, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) {
  return <div style={{ ...BASE, width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

export function SkRows({ n = 4, gap = 10 }: { n?: number; gap?: number }) {
  const widths = ["85%", "70%", "90%", "60%", "78%", "65%", "82%", "55%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: n }, (_, i) => <Sk key={i} w={widths[i % widths.length]} h={13} />)}
    </div>
  );
}

export function SkTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  const width = (i: number) => (i === 0 ? "30%" : `${Math.floor(70 / (cols - 1))}%`);
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {Array.from({ length: cols }, (_, i) => <Sk key={i} w={width(i)} h={11} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ display: "flex", gap: 16, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${CARD}` }}>
            {Array.from({ length: cols }, (_, c) => <Sk key={c} w={width(c)} h={13} r={3} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkGrid({ cards = 6, cardH = 120 }: { cards?: number; cardH?: number }) {
  return (
    <div style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {Array.from({ length: cards }, (_, i) => <div key={i} style={{ ...BASE, height: cardH, borderRadius: 8 }} />)}
    </div>
  );
}

export function SkBar({ h = 36 }: { h?: number }) {
  return <div style={{ ...BASE, height: h, borderRadius: 6, width: "100%" }} />;
}
