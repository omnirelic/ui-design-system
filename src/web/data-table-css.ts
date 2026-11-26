// Feuille de DataTable et Pager (CLP web/src/admin/admin-responsive.css, blocs `.admin-dt*` et `.admin-pager*`), classes renommées `omni-*`.
// Couleurs = jetons du thème ; mesures identiques à CLP. Posée une fois dans <head> au chargement du module.
import { ACCENT, BORDER, DIM } from "./theme";

export const DATA_TABLE_CSS = `
.omni-dt-scroll{overflow-x:auto}
.omni-dt{display:grid;grid-template-columns:var(--dt-cols);row-gap:6px;column-gap:0;min-width:var(--dt-min,0)}
.omni-dt-row{display:grid;grid-column:1/-1;grid-template-columns:subgrid;gap:12px;align-items:center;padding:0.625rem 0.875rem;border:1px solid ${BORDER};border-radius:8px;box-sizing:border-box}
.omni-dt-head{border-color:transparent;background:transparent;padding-top:0;padding-bottom:0}
.omni-dt-clickable{cursor:pointer;transition:border-color .15s ease}
.omni-dt-clickable:hover,.omni-dt-clickable:focus-visible{border-color:${ACCENT}!important;outline:none}
.omni-dt-cell{min-width:0;overflow-wrap:anywhere}
.omni-dt-expanded{grid-column:1/-1;margin:-4px 0 2px;padding:1rem 1.25rem;border:1px solid ${BORDER};border-top:none;border-radius:0 0 6px 6px}
@media (max-width:640px){
.omni-dt{display:flex;flex-direction:column;row-gap:6px;min-width:0}
.omni-dt-head,.omni-dt-hide-sm{display:none}
.omni-dt-row{display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:0.75rem}
.omni-dt-cell[data-label]{display:flex;justify-content:space-between;gap:12px;text-align:right!important}
.omni-dt-cell[data-label]::before{content:attr(data-label);color:${DIM};font-size:0.6875rem;letter-spacing:0.1em;text-transform:uppercase;flex-shrink:0}
.omni-dt-primary{font-weight:700}
}
.omni-pager{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px}
.omni-pager-pages{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
@media (max-width:640px){
.omni-pager{justify-content:center}
.omni-pager-size{display:none}
}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-dt")) {
  const style = document.createElement("style");
  style.id = "omni-dt";
  style.textContent = DATA_TABLE_CSS;
  document.head.appendChild(style);
}
