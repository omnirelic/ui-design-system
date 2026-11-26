// Zone de dépôt de fichier survolée par un glisser-déposer (web/src/ui/controls.css de CLP, `[data-file-drop]`) : contour pointillé « prête » dès qu'un fichier survole la fenêtre,
// « dessus » avec voile sur la zone survolée. Accent du thème, posé une fois dans <head> au chargement du module.
import { ACCENT } from "./theme";
import { tint } from "./controls";

export const FILE_DROP_CSS = `
[data-file-drop="ready"]{outline:1px dashed ${tint(ACCENT, 60)};outline-offset:2px}
[data-file-drop="over"]{outline:2px dashed ${ACCENT};outline-offset:2px;box-shadow:inset 0 0 0 999px ${tint(ACCENT, 14)}}
`;

if (typeof document !== "undefined" && !document.getElementById("omni-file-drop")) {
  const style = document.createElement("style");
  style.id = "omni-file-drop";
  style.textContent = FILE_DROP_CSS;
  document.head.appendChild(style);
}
