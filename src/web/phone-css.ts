// Feuille du numéro masqué et de la pastille de numéro : `.clp-masked-phone*` de admin-responsive.css et `.clp-phone*` de entity-cards.css de Chez la Petite,
// classes `clp-` renommées `omni-`. Géométrie identique ; toute couleur est un jeton du thème (l'orange et le jaune d'Orange et MTN deviennent l'avertissement et
// l'accent du thème, le vert de la pastille le succès). Posée une fois dans <head> au chargement du module (id `omni-phone`).
import { ACCENT, BORDER, DIM } from "./theme";
import { toneColor } from "./pastille-model";
import { tint } from "./controls";

const SUCCESS = toneColor("success");

export const PHONE_CSS = `
.omni-masked-phone{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.omni-masked-op{font-size:.75rem;font-weight:600;letter-spacing:.06em}
.omni-masked-op--orange{color:${toneColor("warning")}}
.omni-masked-op--mtn{color:${ACCENT}}
.omni-masked-op--inconnu{color:${DIM}}
.omni-phone{display:inline-flex;align-items:center;gap:8px}
.omni-phone-main{display:inline-flex;align-items:center;gap:9px;padding:7px 12px 7px 13px;color:inherit;background:${tint(SUCCESS, 13)};border:1px solid ${tint(SUCCESS, 45)};border-radius:999px;cursor:pointer;transition:background .15s,border-color .15s}
.omni-phone-main:hover{background:${tint(SUCCESS, 22)};border-color:${SUCCESS}}
.omni-phone-main:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px}
.omni-phone-main>svg:first-child{color:${SUCCESS}}
.omni-phone-tag{padding-left:9px;border-left:1px solid ${BORDER}}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-phone")) {
  const style = document.createElement("style");
  style.id = "omni-phone";
  style.textContent = PHONE_CSS;
  document.head.appendChild(style);
}
