// Styles des notes vocales posés une fois dans <head> au chargement du module : animations de l'enregistreur (`clpWave`, `clpPulse` de CLP) et message vocal
// (`.clpc-vn`, `.clpc-aud-*`, `.clpc-vm` de web/src/chat/chat.css). Couleurs = jetons du thème ; encre sur fond doré (message envoyé) = fond du thème.
import { ACCENT, BG, CARD, DIM, MONO } from "./theme";
import { tint } from "./controls";

export const VOICE_CSS = `
@keyframes omni-wave{0%,100%{transform:scaleY(0.22)}50%{transform:scaleY(1)}}
@keyframes omni-pulse{0%,100%{opacity:1}50%{opacity:0.3}}
.omni-vn{display:grid;grid-template-columns:44px 44px 1fr;grid-template-rows:44px auto;column-gap:0;align-items:center;width:256px;color:${DIM}}
.omni-vn-av{position:relative;width:44px;height:44px;border-radius:50%;background:${BG};display:grid;place-items:center;flex:none;color:${ACCENT}}
.omni-vn-av img,.omni-vn-av svg.omni-vn-logo{height:29px;display:block}
.omni-vn[data-mine] .omni-vn-av{background:${BG}}
.omni-vn-badge{position:absolute;right:-2px;bottom:-2px;width:20px;height:20px;border-radius:50%;background:${DIM};color:${BG};display:grid;place-items:center;box-shadow:0 0 0 2px ${CARD}}
.omni-vn[data-mine] .omni-vn-badge{box-shadow:0 0 0 2px ${ACCENT}}
.omni-vn-badge svg{width:12px;height:12px;display:block}
.omni-vn .omni-aud-b{width:44px;height:44px;display:grid;place-items:center;flex:none;background:none;border:0;padding:0;color:${DIM};cursor:pointer}
.omni-aud-b svg{width:26px;height:26px;display:block}
.omni-vn[data-mine] .omni-aud-b{color:${BG}}
.omni-aud-w{grid-column:3;grid-row:1;position:relative;display:flex;align-items:center;justify-content:space-between;height:28px;cursor:pointer;color:${DIM}}
.omni-aud-w i{width:2px;border-radius:1px;background:currentColor;opacity:.45}
.omni-aud-w i.on{opacity:1;color:${ACCENT}}
.omni-vn[data-mine] .omni-aud-w{color:${BG}}
.omni-vn[data-mine] .omni-aud-w i.on{color:${BG}}
.omni-aud-w b{position:absolute;top:50%;width:10px;height:10px;margin:-5px 0 0 -1px;border-radius:50%;background:${ACCENT}}
.omni-vn[data-mine] .omni-aud-w b{background:${BG}}
.omni-aud-w:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.omni-vm{grid-column:3;display:flex;justify-content:space-between;align-items:center;font:400 15px ${MONO};color:${DIM};line-height:18px}
.omni-vn[data-mine] .omni-vm{color:${tint(BG, 70)}}
.omni-aud-t{font:400 15px ${MONO}}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-voice")) {
  const style = document.createElement("style");
  style.id = "omni-voice";
  style.textContent = VOICE_CSS;
  document.head.appendChild(style);
}
