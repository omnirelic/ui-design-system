// Feuille de la coque d'admin (web/src/admin/admin-responsive.css de Chez la Petite : page, en-tête, barre de filtres, rail, hub, menu de gauche, barre du haut, pastille « nuit »
// et la bascule hors-champ du menu sous 900 px), classes renommées `omni-shell-*`. Mesures, points de rupture (640 / 760 / 900 px) et durées identiques à CLP ;
// couleurs = jetons du thème. Posée une fois dans <head> au chargement du module.
import { ACCENT, BG, BG2, BORDER, CARD, DIM, TXT } from "./theme";
import { tint } from "./controls";
import { toneColor } from "./pastille-model";

const WARN = toneColor("warning");
const faint = (pct: number) => `color-mix(in srgb, ${TXT} ${pct}%, transparent)`;
const SCRIM = "color-mix(in srgb, black 60%, transparent)";
const SHADOW_NAV = "8px 0 32px color-mix(in srgb, black 50%, transparent)";

export const ADMIN_SHELL_CSS = `
.omni-shell-root{height:100dvh;overflow:hidden;display:flex;background:${BG};font-family:inherit}
.omni-shell-main{flex:1;overflow:auto;padding-bottom:calc(1.75rem + env(safe-area-inset-bottom))}
@media (max-width:640px){.omni-shell-main{padding-bottom:calc(5.5rem + env(safe-area-inset-bottom))}}

.omni-shell-page{padding:40px 48px;box-sizing:border-box;max-width:100%}
@media (max-width:900px){.omni-shell-page{padding:24px 20px}}
@media (max-width:640px){.omni-shell-page{padding:16px 14px}}
@media (max-width:640px){.omni-shell-page button,.omni-shell-page [role="tab"]{min-height:44px}}
@media (max-width:640px){.omni-shell-page [style*="grid-template-columns"]{grid-template-columns:minmax(0,1fr)!important}}
.omni-shell-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:28px}
.omni-shell-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.omni-shell-filters>*{min-width:0}
.omni-shell-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:640px){.omni-shell-grid2{grid-template-columns:1fr}}

.omni-shell-only-mobile{display:none!important}
@media (max-width:900px){.omni-shell-only-mobile{display:inline-flex!important}.omni-shell-only-desktop{display:none!important}}

.omni-shell-sidebar{width:max-content;min-width:0;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid ${BORDER};background:${BG2};height:100%}
@media (min-width:901px){.omni-shell-sidebar--collapsed{display:none!important}}
@media (max-width:900px){
.omni-shell-sidebar{position:fixed;inset:0 auto 0 0;z-index:150;transform:translateX(-100%);transition:transform .22s ease;box-shadow:none}
.omni-shell-sidebar--open{transform:translateX(0);box-shadow:${SHADOW_NAV}}
.omni-shell-backdrop{position:fixed;inset:0;background:${SCRIM};z-index:149}
}
.omni-shell-nav{display:flex;flex-direction:column}
.omni-shell-navitem{width:100%;justify-content:flex-start;gap:0.75rem;padding:0.6875rem 1rem;font-size:0.9375rem;min-height:1.875rem}

.omni-shell-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:nowrap;padding:12px 48px 0;box-sizing:border-box}
.omni-shell-tabs{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;min-width:0;scrollbar-width:none}
.omni-shell-tabs::-webkit-scrollbar{display:none}
.omni-shell-tabs>*{flex-shrink:0}
.omni-shell-bar>:not(.omni-shell-tabs){flex-shrink:0}
@media (max-width:640px){.omni-shell-bar{flex-wrap:wrap}}
@media (max-width:900px){.omni-shell-bar{padding:12px 20px 0}}
@media (max-width:640px){.omni-shell-bar{padding:10px 14px 0}}
.omni-shell-badge{display:inline-block;margin-left:0.5rem;min-width:1.25rem;box-sizing:border-box;padding:0 0.375rem;text-align:center;background:${ACCENT};color:${BG};border-radius:6.25rem;font-size:0.75rem;font-weight:600;line-height:1.25rem}
.omni-shell-hubpane{padding:28px 48px 40px;box-sizing:border-box;max-width:100%}
.omni-shell-hubpane>.omni-shell-page{padding:0}
@media (max-width:900px){.omni-shell-hubpane{padding:20px 20px 24px}}
@media (max-width:640px){.omni-shell-hubpane{padding:14px 14px 16px}}
@property --omni-tabs-fade{syntax:"<length>";inherits:false;initial-value:0px}
@keyframes omni-tabs-fade{0%{--omni-tabs-fade:4rem}92%,100%{--omni-tabs-fade:0px}}
@supports (animation-timeline:scroll()){
.omni-shell-tabs{animation:omni-tabs-fade linear both;animation-timeline:scroll(self inline);-webkit-mask-image:linear-gradient(to right,black calc(100% - var(--omni-tabs-fade)),transparent);mask-image:linear-gradient(to right,black calc(100% - var(--omni-tabs-fade)),transparent)}
}

.omni-shell-rail-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:28px;align-items:start}
.omni-shell-rail{position:sticky;top:0;display:flex;flex-direction:column;gap:2px}
.omni-shell-rail-title{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:2rem;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:${DIM};padding:0 4px 8px 12px}
.omni-shell-rail-actions{display:inline-flex;align-items:center;gap:4px}
.omni-shell-rail-item{position:relative;display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:9px 12px;cursor:pointer;color:${DIM};font:inherit;font-size:0.84375rem;transition:background .12s,color .12s}
.omni-shell-rail-item:hover{background:${faint(6)};color:${TXT}}
.omni-shell-rail-item:focus-visible{outline:none;box-shadow:0 0 0 2px ${tint(ACCENT, 40)}}
.omni-shell-rail-item[aria-selected="true"]{background:${tint(ACCENT, 10)};color:${TXT};font-weight:600}
.omni-shell-rail-item[aria-selected="true"]::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:3px;background:${ACCENT}}
.omni-shell-rail-icon{display:inline-flex;flex:none;color:${ACCENT};opacity:.85}
.omni-shell-rail-label{flex:1;min-width:0}
.omni-shell-rail-count{font-size:0.75rem;color:${DIM};background:${faint(8)};border-radius:10px;padding:0 7px;min-width:22px;text-align:center}
.omni-shell-rail-count.alert{background:${tint(WARN, 12)};color:${WARN}}
.omni-shell-rail-pane{min-width:0}
@media (max-width:760px){
.omni-shell-rail-layout{grid-template-columns:minmax(0,1fr);gap:16px}
.omni-shell-rail{position:static;flex-direction:row;overflow-x:auto;gap:8px;-webkit-overflow-scrolling:touch}
.omni-shell-rail-title{flex:none;padding:0}
.omni-shell-rail-title-text{display:none}
.omni-shell-rail-title:not(:has(.omni-shell-rail-actions)){display:none}
.omni-shell-rail-item{width:auto;flex:none;white-space:nowrap;border:1px solid ${BORDER};border-radius:20px;padding:7px 14px}
.omni-shell-rail-item[aria-selected="true"]::before{display:none}
.omni-shell-rail-item[aria-selected="true"]{border-color:${ACCENT}}
}

@media (max-width:640px){.omni-shell-search-label{display:none}.omni-shell-fontscale{display:none!important}}
@media (max-width:640px){.omni-shell-tools button{min-height:40px!important}}

body.omni-admin-mode [style*="cursor: pointer"]{transition:filter .15s ease}
body.omni-admin-mode [style*="cursor: pointer"]:hover:not(:disabled):not([aria-disabled="true"]){filter:brightness(1.25)}

html.omni-admin-night{--o-accent:color-mix(in srgb,white 96%,black);--o-accent-light:color-mix(in srgb,white 12%,transparent)}
.omni-shell-moon{position:relative;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:1px solid ${DIM};background:radial-gradient(circle,${CARD},${BG});color:${TXT};animation:omni-night-in .45s ease-out both}
.omni-shell-moon[data-leaving="true"]{animation:omni-night-out .4s ease-in both}
.omni-shell-moon svg{animation:omni-moon-float 3.6s ease-in-out infinite}
.omni-shell-moon::after{content:"";position:absolute;width:32px;height:32px;border-radius:50%;box-shadow:0 0 0 0 ${faint(35)};animation:omni-moon-halo 3.6s ease-out infinite;pointer-events:none}
@keyframes omni-night-in{from{opacity:0;transform:scale(.4) rotate(-40deg)}to{opacity:1;transform:none}}
@keyframes omni-night-out{from{opacity:1;transform:none}to{opacity:0;transform:scale(.4) rotate(40deg)}}
@keyframes omni-moon-float{0%,100%{transform:translateY(1.5px) rotate(-6deg)}50%{transform:translateY(-1.5px) rotate(6deg)}}
@keyframes omni-moon-halo{0%{box-shadow:0 0 0 0 ${faint(35)}}70%,100%{box-shadow:0 0 0 9px ${faint(0)}}}
@media (prefers-reduced-motion:reduce){.omni-shell-moon,.omni-shell-moon svg,.omni-shell-moon::after{animation:none}}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-shell")) {
  const style = document.createElement("style");
  style.id = "omni-shell";
  style.textContent = ADMIN_SHELL_CSS;
  document.head.appendChild(style);
}
