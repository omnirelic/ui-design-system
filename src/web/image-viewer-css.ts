// Styles du visualiseur d'images et de la vignette cliquable (web/src/admin/ui/image-viewer.css de CLP), posés une fois dans <head> au chargement du module.
// Valeurs en rem (elles suivent le réglage de taille de police). Le visualiseur reste sombre dans tous les thèmes, comme chez CLP (fond #050505) :
// noir et blanc par mélange (`color-mix`), accent du thème pour le lien et le focus. Aucune couleur hexadécimale.
import { ACCENT } from "./theme";
import { tint } from "./controls";

export const VIEWER_BG = "color-mix(in srgb, black 98%, white)";
export const VIEWER_INK = "color-mix(in srgb, white 94%, black)";
export const VIEWER_DIM = "color-mix(in srgb, white 60%, black)";
const SCRIM = "color-mix(in srgb, black 72%, transparent)";
const NAV_BG = "color-mix(in srgb, black 45%, transparent)";

export const IMAGE_VIEWER_CSS = `
.ivw-thumb{display:block;padding:0;margin:0;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:zoom-in;border-radius:0.5rem;transition:filter 0.12s,box-shadow 0.12s}
.ivw-thumb img{display:block;max-width:100%;border-radius:0.5rem}
.ivw-thumb:hover{filter:brightness(1.12)}
.ivw-thumb:focus-visible{outline:none;box-shadow:0 0 0 2px ${ACCENT}}
.ivw-thumb--cover img{max-height:16.25rem;object-fit:cover}

.ivw{position:absolute;inset:0;display:flex;flex-direction:column;outline:none;color:${VIEWER_INK}}
.ivw-bar{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:0.75rem;padding:0.625rem 0.875rem;background:linear-gradient(${SCRIM},transparent)}
.ivw-title{min-width:0;flex:1;display:flex;flex-direction:column}
.ivw-acts{flex:none;display:flex;gap:0.25rem}

.ivw-stage{position:relative;flex:1;min-height:0;display:flex;overflow:hidden;padding:0.5rem;touch-action:pan-y pinch-zoom}
.ivw-stage:not([data-zoom="1"]){overflow:auto;touch-action:auto}
.ivw-img{display:block;margin:auto;max-width:100%;max-height:100%;object-fit:contain;cursor:zoom-in;user-select:none;transition:opacity 0.15s}
.ivw-stage:not([data-zoom="1"]) .ivw-img{cursor:zoom-out}
.ivw-img--pending{opacity:0}
.ivw-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.ivw-error{margin:auto;display:flex;flex-direction:column;align-items:center;gap:0.5rem;color:${VIEWER_DIM}}
.ivw-fallback{color:${ACCENT};text-decoration:none;border-bottom:1px dotted ${ACCENT}}
.ivw-fallback:hover{background:${tint(ACCENT, 12)}}

.ivw .ivw-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:2;background:${NAV_BG};border-radius:50%}
.ivw .ivw-nav--prev{left:0.75rem}
.ivw .ivw-nav--next{right:0.75rem}

@media (max-width:880px){
.ivw-bar{padding:0.5rem;gap:0.5rem}
.ivw-acts{gap:0}
.ivw .ivw-nav{top:auto;bottom:1rem;transform:none}
.ivw .ivw-nav--prev{left:1rem}
.ivw .ivw-nav--next{right:1rem}
}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-image-viewer")) {
  const style = document.createElement("style");
  style.id = "omni-image-viewer";
  style.textContent = IMAGE_VIEWER_CSS;
  document.head.appendChild(style);
}
