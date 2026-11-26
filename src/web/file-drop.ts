// Dépôt (glisser-déposer) et collage de fichiers sur un <input type="file"> caché : les fichiers
// sont injectés dans l'input puis un « change » est émis, donc le onChange existant du champ
// reçoit exactement ce qu'un clic sur « Parcourir » lui donnerait (accept/multiple respectés).

interface Zone { input: HTMLInputElement; target: HTMLElement }

const zones = new Set<Zone>();

/** Vrai si le fichier correspond à un attribut `accept` (`image/*`, `.pdf`, `application/pdf`, liste séparée par des virgules). */
export function matchesAccept(file: { name: string; type: string }, accept: string): boolean {
  const rules = accept.split(",").map(r => r.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some(r => r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? type.startsWith(r.slice(0, -1)) : type === r);
}

/** Fichiers que l'input accepterait : filtrés par `accept`, limités à un seul sans `multiple`. */
export function acceptedFiles(files: Iterable<File> | ArrayLike<File>, input: HTMLInputElement): File[] {
  const ok = Array.from(files).filter(f => matchesAccept(f, input.accept));
  return input.multiple ? ok : ok.slice(0, 1);
}

/** Pose les fichiers dans l'input et déclenche son « change ». */
export function feedInput(input: HTMLInputElement, files: File[]) {
  try {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    input.files = dt.files;
  } catch {
    Object.defineProperty(input, "files", { value: files, configurable: true });
  }
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

// Glissé en cours au-dessus de la fenêtre : toutes les zones actives se signalent (« ready »), la survolée passe à « over ».
let windowDepth = 0;
const syncReady = () => zones.forEach(z => {
  if (z.target.getAttribute("data-file-drop") === "over") return;
  if (windowDepth > 0 && !z.input.disabled) z.target.setAttribute("data-file-drop", "ready"); else z.target.removeAttribute("data-file-drop");
});
const onWindowEnter = (e: DragEvent) => { if (!hasFiles(e)) return; windowDepth++; syncReady(); };
const onWindowLeave = () => { if (!windowDepth) return; windowDepth--; syncReady(); };
const onWindowEnd = () => { windowDepth = 0; syncReady(); };

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
const isShown = (el: HTMLElement) => el.isConnected && el.getClientRects().length > 0;

/** Zone qui reçoit un collage : celle survolée, sinon celle qui a le focus, sinon l'unique candidate. Ambigu → aucune. */
function pasteZone(files: File[]): { zone: Zone; files: File[] } | null {
  const candidates = [...zones]
    .filter(z => !z.input.disabled && isShown(z.target))
    .map(z => ({ zone: z, files: acceptedFiles(files, z.input) }))
    .filter(c => c.files.length > 0);
  return candidates.find(c => c.zone.target.matches(":hover"))
    ?? candidates.find(c => c.zone.target.contains(document.activeElement))
    ?? (candidates.length === 1 ? candidates[0] : null);
}

function onPaste(e: ClipboardEvent) {
  // Le chat agent a ses propres pièces jointes : un collage fait là ne doit JAMAIS alimenter un composer client (risque d'envoi à un client).
  if ((e.target as Element | null)?.closest?.("[data-agent-chat]")) return;
  const files = Array.from(e.clipboardData?.files ?? []);
  if (!files.length) return;
  const hit = pasteZone(files);
  if (!hit) return;
  e.preventDefault();
  feedInput(hit.zone.input, hit.files);
}

/** Rend `target` sensible au dépôt et au collage de fichiers pour `input`. Renvoie le nettoyage. */
export function attachFileDrop(input: HTMLInputElement, target: HTMLElement): () => void {
  let depth = 0;
  const setOver = (on: boolean) => {
    if (on) target.setAttribute("data-file-drop", "over");
    else if (windowDepth > 0 && !input.disabled) target.setAttribute("data-file-drop", "ready");
    else target.removeAttribute("data-file-drop");
  };
  const onEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth++;
    if (!input.disabled) setOver(true);
  };
  const onOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = input.disabled ? "none" : "copy";
  };
  const onLeave = () => {
    if (!depth) return;
    depth--;
    if (!depth) setOver(false);
  };
  const onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    setOver(false);
    if (input.disabled) return;
    const files = acceptedFiles(e.dataTransfer?.files ?? [], input);
    if (files.length) feedInput(input, files);
  };
  target.addEventListener("dragenter", onEnter);
  target.addEventListener("dragover", onOver);
  target.addEventListener("dragleave", onLeave);
  target.addEventListener("drop", onDrop);
  const zone = { input, target };
  if (!zones.size) {
    document.addEventListener("paste", onPaste);
    document.addEventListener("dragenter", onWindowEnter);
    document.addEventListener("dragleave", onWindowLeave);
    document.addEventListener("drop", onWindowEnd);
    document.addEventListener("dragend", onWindowEnd);
  }
  zones.add(zone);
  if (windowDepth > 0) syncReady();
  return () => {
    target.removeEventListener("dragenter", onEnter);
    target.removeEventListener("dragover", onOver);
    target.removeEventListener("dragleave", onLeave);
    target.removeEventListener("drop", onDrop);
    target.removeAttribute("data-file-drop");
    zones.delete(zone);
    if (!zones.size) {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("dragenter", onWindowEnter);
      document.removeEventListener("dragleave", onWindowLeave);
      document.removeEventListener("drop", onWindowEnd);
      document.removeEventListener("dragend", onWindowEnd);
      windowDepth = 0;
    }
  };
}
