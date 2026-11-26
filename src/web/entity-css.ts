// Feuille de la pastille d'entité et des composants `EntityRef` : `pastille.css` (web/src/admin/ui/pastille/) et les règles `.clp-ref*` de
// admin-responsive.css de CLP, classes `clp-` renommées `omni-`. Géométrie, paliers de conteneur et durées identiques ; toute couleur est un jeton du thème
// (`--o-*` via theme.ts, `toneColor`), aucun hexadécimal. Posée une fois dans <head> au chargement du module (id `omni-entity`).
// Non repris : pastilles jumelées (`--glue`), empilées (`.clp-stk*`), livreur (`.clp-ring`, `.clp-pst-count`), ligne bare (`PastilleRow`) — propres aux cartes commande et livreur de CLP.
import { ACCENT, BORDER, CARD, BG2, DIM, TXT } from "./theme";
import { toneColor } from "./pastille-model";
import { tint } from "./controls";

const SUCCESS = toneColor("success");
const WARN = toneColor("warning");
const BAD = toneColor("danger");
const INFO = toneColor("info");

export const ENTITY_CSS = `
.omni-pst{--h:1.875rem;display:inline-flex;align-items:center;gap:.5rem;max-width:100%;height:var(--h);box-sizing:border-box;border:1px solid ${BORDER};border-radius:calc(var(--h) / 2);padding:0 .75rem 0 .1875rem;background:${CARD};color:${TXT};white-space:nowrap;vertical-align:middle;line-height:1;transition:border-color .15s,background .15s}
.omni-pst:hover{border-color:${ACCENT};background:${tint(ACCENT, 8)}}
.omni-pst--gold{border-color:${tint(ACCENT, 45)};background:${tint(ACCENT, 14)}}
.omni-pst-link{display:inline-flex;max-width:100%;color:inherit;text-decoration:none;border-radius:.9375rem}
.omni-pst-link:focus-visible .omni-pst,.omni-ref:hover .omni-pst-link .omni-pst{border-color:${ACCENT};background:${tint(ACCENT, 8)}}
.omni-pst-lead{display:inline-flex;align-items:center;justify-content:center;flex:none;box-sizing:border-box;border-radius:50%;border:1px solid ${BORDER};background:${BG2};color:${DIM}}
.omni-pst-lead--sm{width:1.375rem;height:1.375rem}
.omni-pst-lead--md{width:1.75rem;height:1.75rem}
.omni-pst-lead--lg{width:2.5rem;height:2.5rem}
.omni-pst-lead--tint{background:color-mix(in srgb,var(--omni-lead-tint) 16%,${BG2});border-color:color-mix(in srgb,var(--omni-lead-tint) 45%,transparent);color:var(--omni-lead-ink,var(--omni-lead-tint))}
.omni-pst-sg{display:inline-flex;align-items:center;gap:.4rem;min-width:0}
.omni-pst-sg+.omni-pst-sg::before{content:"|";color:${BORDER};margin-right:.1rem}
.omni-pst-sg--label{overflow:hidden;text-overflow:ellipsis}
.omni-pst-sg--label>:first-child:not(.omni-pst-sd){min-width:0;overflow:hidden;text-overflow:ellipsis}
.omni-pst-sd{width:.5rem;height:.5rem;border-radius:50%;flex:none}
.omni-pst-q{position:relative;align-self:stretch;display:inline-flex;align-items:center;gap:.375rem;margin:0 -.75rem 0 0;padding:0 .75rem 0 .625rem;border-left:1px solid ${BORDER};border-radius:0 calc(var(--h) / 2 - 1px) calc(var(--h) / 2 - 1px) 0;font-size:.8125rem;font-weight:700;color:${DIM};background:${BG2}}
.omni-pst-q--green{color:${SUCCESS};background:${tint(SUCCESS, 16)};border-left-color:${tint(SUCCESS, 45)}}
.omni-pst-q--gold{color:${ACCENT};background:${tint(ACCENT, 18)};border-left-color:${tint(ACCENT, 50)}}
.omni-pst-q--orange{color:${WARN};background:${tint(WARN, 15)};border-left-color:${tint(WARN, 45)}}
.omni-pst-q--red{color:${BAD};background:${tint(BAD, 15)};border-left-color:${tint(BAD, 50)}}
.omni-pst-q--violet{color:${INFO};background:${tint(INFO, 17)};border-left-color:${tint(INFO, 50)}}
.omni-pst--compact{--h:1.75rem;gap:.4375rem;padding:0 .6875rem 0 .125rem}
.omni-pst--point{position:relative;width:1.75rem;height:1.75rem;padding:0;border:0;background:none;border-radius:50%}
.omni-pst--point:hover{background:none;box-shadow:0 0 0 2px ${ACCENT}}
.omni-pst-dot{position:absolute;left:calc(50% + .6188rem - .3125rem);top:calc(50% + .6188rem - .3125rem);width:.625rem;height:.625rem;border-radius:50%;box-shadow:0 0 0 2px ${CARD}}
.omni-pst-box{display:block;max-width:100%;container:pst / inline-size}
@container pst (max-width:520px){.omni-pst .omni-pst-sg[data-pos="4"]{display:none}}
@container pst (max-width:460px){.omni-pst .omni-pst-ql{display:none}.omni-pst .omni-pst-q{padding:0 .6875rem 0 .625rem}}
@container pst (max-width:400px){.omni-pst .omni-pst-sg[data-pos="3"]{display:none}.omni-pst-ql{display:none}.omni-pst-q{padding:0 .6875rem 0 .625rem}}
@container pst (max-width:270px){.omni-pst .omni-pst-sg[data-pos="2"]{display:none}}
@container pst (max-width:190px){.omni-pst-sg,.omni-pst-q{display:none}.omni-pst{padding-right:.1875rem;gap:0}}
@container pst (max-width:460px){.omni-pst .omni-pst-q:hover::after{content:attr(data-label);position:absolute;z-index:5;top:calc(100% + .25rem);right:0;padding:.25rem .5rem;border:1px solid ${BORDER};border-radius:.5rem;background:${CARD};color:${TXT};font-size:.75rem;font-weight:600;white-space:nowrap}}
@container pst (max-width:400px){.omni-pst-q:hover::after{content:attr(data-label);position:absolute;z-index:5;top:calc(100% + .25rem);right:0;padding:.25rem .5rem;border:1px solid ${BORDER};border-radius:.5rem;background:${CARD};color:${TXT};font-size:.75rem;font-weight:600;white-space:nowrap}}
.omni-pst-pre{display:inline-flex;margin-left:.375rem;margin-right:-.125rem;font-variant-numeric:tabular-nums}
.omni-pst-var,.omni-pst-stock{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:1.25rem;border-radius:.625rem;border:1px solid;font-size:.75rem;font-weight:700;line-height:1}
.omni-pst-var{min-width:0;max-width:12rem;padding:0 .5rem;margin-left:.125rem;background:${tint(INFO, 15)};border-color:${tint(INFO, 45)};color:${INFO};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;line-height:1.125rem}
.omni-pst-stock{gap:.2rem;min-width:1.25rem;padding:0 .375rem;font-variant-numeric:tabular-nums}
.omni-pst-stock--ok{background:${tint(DIM, 16)};border-color:${tint(DIM, 40)};color:${DIM}}
.omni-pst-stock--low{background:${tint(WARN, 12)};border-color:${tint(WARN, 40)};color:${WARN}}
.omni-pst-stock--out{background:${tint(BAD, 15)};border-color:${tint(BAD, 50)};color:${BAD}}
.omni-pst-stock--made_to_order{background:${tint(ACCENT, 16)};border-color:${tint(ACCENT, 50)};color:${ACCENT}}
.omni-pst--dim .omni-pst-sg--label>:not(.omni-pst-sd):not(.omni-pst-var){opacity:.55}
.omni-ref{position:relative;display:inline-flex;vertical-align:middle}
.omni-ref-num{color:inherit;text-decoration:none;transition:color .15s}
.omni-ref-num:hover{color:${ACCENT}}
.omni-ref-dot{width:8px;height:8px;border-radius:50%;flex:none}
.omni-ref-swatch{display:inline-block;flex:none;border-radius:50%;box-shadow:0 0 0 2px ${tint(TXT, 19)}}
.omni-ref-swatch-none{background:${DIM};opacity:.5}
.omni-ref-pop{display:flex;min-width:220px;flex-direction:column;gap:2px;padding:6px;background:${CARD};border:1px solid ${BORDER};border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.6)}
.omni-ref-pop--bare{min-width:0;margin-top:12px;padding:8px 0 0;background:none;border:0;border-top:1px solid ${BORDER};border-radius:0;box-shadow:none}
.omni-ref-item{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:6px 10px;border-radius:6px;color:${TXT};text-decoration:none}
.omni-ref-item:hover{background:${tint(TXT, 7)}}
.omni-ref-off{display:flex;width:100%;padding:6px 10px;border:0;background:none;color:${DIM};font:inherit;text-align:left;cursor:not-allowed}
.omni-ref-row{display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid ${BORDER};transition:background .15s}
.omni-ref-row:hover{background:${tint(TXT, 3)}}
.omni-ref-row--action{flex-wrap:wrap}
.omni-ref-row--action>*{white-space:nowrap}
.omni-ref-row--action .omni-ref-action{margin-left:auto}
.omni-ref-fill{flex:1;min-width:0;display:inline-flex;align-items:baseline;flex-wrap:wrap}
.omni-ref-stack{display:flex;flex-direction:column;gap:2px;min-width:0}
.omni-ref-act{opacity:0;transition:opacity .15s}
.omni-ref-row:hover .omni-ref-act,.omni-ref-row:focus-within .omni-ref-act{opacity:1}
.omni-ref-card{border:1px solid ${BORDER};border-radius:12px;background:${CARD};overflow:hidden}
.omni-ref-band{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid ${BORDER};background:${tint(ACCENT, 8)}}
.omni-ref-body{display:flex;flex-direction:column;gap:6px;padding:12px 14px}
.omni-ref-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 14px;border-top:1px solid ${BORDER}}
.omni-ref-compact .omni-ref-row{flex-wrap:wrap;border-bottom:0;padding:7px 0;gap:4px 10px}
.omni-ref-compact .omni-ref-fill{display:block}
.omni-ref-compact .omni-ref-fill>:last-child{white-space:nowrap}
.omni-ref-compact .omni-ref-row>:last-child{flex-basis:100%;padding-left:38px}
.omni-ref-detail{display:flex;align-items:center;gap:16px;padding-bottom:16px}
.omni-ref-detail .omni-ref-stack{gap:6px}
.omni-ref-detail-title{display:flex;align-items:center;flex-wrap:wrap;gap:10px;min-width:0}
@media (hover:none){.omni-ref-act{opacity:1}}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-entity")) {
  const style = document.createElement("style");
  style.id = "omni-entity";
  style.textContent = ENTITY_CSS;
  document.head.appendChild(style);
}
