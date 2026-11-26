// Faux champ de recherche qui ouvre la palette de commandes (web/src/admin/ui/SearchTrigger.tsx de Chez la Petite). Le libellé se réduit à l'icône sous 640 px.
import "./admin-shell-css";
import { Icon } from "./Icon";
import { ACCENT, BORDER, DIM, MONO, TXT, rem } from "./theme";

const CSS = `
.omni-shell-search{display:flex;align-items:center;gap:${rem(8)};cursor:pointer;flex:0 1 220px;min-width:0;padding:${rem(6)} ${rem(12)};background:transparent;border:1px solid ${BORDER};border-radius:6px;color:${DIM};font-size:${rem(12)};font-family:${MONO};transition:all .15s;justify-content:space-between}
.omni-shell-search:hover,.omni-shell-search:focus-visible{border-color:${ACCENT};color:${TXT};outline:none}
`;
if (typeof document !== "undefined" && !document.getElementById("omni-shell-search")) {
  const style = document.createElement("style");
  style.id = "omni-shell-search";
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function AdminSearchTrigger({ onClick, label = "Rechercher…", shortcut = "⌘K", ariaLabel = "Rechercher un menu" }: { onClick: () => void; label?: string; shortcut?: string; ariaLabel?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} aria-keyshortcuts="Meta+K Control+K" className="omni-shell-search">
      <span style={{ display: "flex", alignItems: "center", gap: rem(8) }}><Icon name="action-search" size={14} /><span className="omni-shell-search-label">{label}</span></span>
      <span className="omni-shell-search-label" style={{ border: `1px solid ${BORDER}`, borderRadius: 3, padding: "1px 5px" }}>{shortcut}</span>
    </button>
  );
}
