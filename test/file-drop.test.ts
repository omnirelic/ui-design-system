// @vitest-environment jsdom
// Tests miroir de web/src/ui/__tests__/file-drop.test.ts de Chez la Petite ; seuls les imports changent.
import { describe, it, expect, afterEach, vi } from "vitest";
import { matchesAccept, acceptedFiles, attachFileDrop } from "../src/web/file-drop";

const png = () => new File(["x"], "capture.png", { type: "image/png" });
const jpg = () => new File(["x"], "photo.jpg", { type: "image/jpeg" });
const pdf = () => new File(["x"], "contrat.pdf", { type: "application/pdf" });

describe("matchesAccept", () => {
  it("accepte tout sans contrainte", () => { expect(matchesAccept(pdf(), "")).toBe(true); });
  it("gère les jokers de type", () => {
    expect(matchesAccept(png(), "image/*")).toBe(true);
    expect(matchesAccept(pdf(), "image/*")).toBe(false);
  });
  it("gère les extensions et les types exacts", () => {
    expect(matchesAccept(pdf(), ".pdf,application/pdf")).toBe(true);
    expect(matchesAccept(new File(["x"], "CV.DOCX"), ".pdf,.doc,.docx")).toBe(true);
    expect(matchesAccept(png(), ".pdf,application/pdf")).toBe(false);
  });
});

describe("acceptedFiles", () => {
  const input = (attrs: { accept?: string; multiple?: boolean }) => { const i = document.createElement("input"); i.type = "file"; i.accept = attrs.accept ?? ""; i.multiple = !!attrs.multiple; return i; };
  it("filtre par accept et garde un seul fichier sans multiple", () => {
    expect(acceptedFiles([pdf(), png(), jpg()], input({ accept: "image/*" }))).toEqual([expect.objectContaining({ name: "capture.png" })]);
  });
  it("garde tous les fichiers valides avec multiple", () => {
    expect(acceptedFiles([pdf(), png(), jpg()], input({ accept: "image/*", multiple: true }))).toHaveLength(2);
  });
});

function setup(attrs: { disabled?: boolean; multiple?: boolean } = {}) {
  const label = document.createElement("label");
  label.getClientRects = () => [{}] as unknown as DOMRectList;
  const input = document.createElement("input");
  input.type = "file"; input.accept = "image/*"; input.disabled = !!attrs.disabled; input.multiple = !!attrs.multiple;
  label.appendChild(input);
  document.body.appendChild(label);
  const onChange = vi.fn(() => (input.files ? Array.from(input.files).map(f => f.name) : []));
  input.addEventListener("change", onChange);
  const detach = attachFileDrop(input, label);
  return { label, input, onChange, detach };
}

function dragEvent(type: string, files: File[]) {
  const e = new Event(type, { bubbles: true, cancelable: true }) as Event & { dataTransfer: unknown };
  e.dataTransfer = { types: ["Files"], files, dropEffect: "none" };
  return e;
}

function pasteEvent(files: File[]) {
  const e = new Event("paste", { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
  e.clipboardData = { files };
  return e;
}

let cleanups: Array<() => void> = [];
afterEach(() => { cleanups.forEach(c => c()); cleanups = []; document.body.innerHTML = ""; });

describe("attachFileDrop — glisser-déposer", () => {
  it("surligne la zone pendant le survol puis l'éteint à la sortie", () => {
    const { label, detach } = setup(); cleanups.push(detach);
    label.dispatchEvent(dragEvent("dragenter", [png()]));
    expect(label.getAttribute("data-file-drop")).toBe("over");
    label.dispatchEvent(dragEvent("dragleave", []));
    expect(label.hasAttribute("data-file-drop")).toBe(false);
  });

  it("transmet le fichier déposé au change de l'input", () => {
    const { label, input, onChange, detach } = setup(); cleanups.push(detach);
    const drop = dragEvent("drop", [png()]);
    label.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.files?.[0]?.name).toBe("capture.png");
  });

  it("ignore un fichier qui ne correspond pas à accept", () => {
    const { label, onChange, detach } = setup(); cleanups.push(detach);
    label.dispatchEvent(dragEvent("drop", [pdf()]));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ne transmet rien quand l'input est désactivé, mais bloque l'ouverture du fichier par le navigateur", () => {
    const { label, onChange, detach } = setup({ disabled: true }); cleanups.push(detach);
    label.dispatchEvent(dragEvent("dragenter", [png()]));
    expect(label.hasAttribute("data-file-drop")).toBe(false);
    const drop = dragEvent("drop", [png()]);
    label.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("signale toutes les zones actives dès qu'un fichier survole la fenêtre, puis les éteint", () => {
    const a = setup(); const b = setup({ disabled: true }); cleanups.push(a.detach, b.detach);
    document.dispatchEvent(dragEvent("dragenter", [png()]));
    expect(a.label.getAttribute("data-file-drop")).toBe("ready");
    expect(b.label.hasAttribute("data-file-drop")).toBe(false);
    a.label.dispatchEvent(dragEvent("dragenter", [png()]));
    expect(a.label.getAttribute("data-file-drop")).toBe("over");
    a.label.dispatchEvent(dragEvent("drop", [png()]));
    expect(a.label.hasAttribute("data-file-drop")).toBe(false);
    expect(b.label.hasAttribute("data-file-drop")).toBe(false);
  });

  it("ne touche pas aux glissés qui ne sont pas des fichiers", () => {
    const { label, detach } = setup(); cleanups.push(detach);
    const e = dragEvent("dragenter", []); (e.dataTransfer as { types: string[] }).types = ["text/plain"];
    label.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(label.hasAttribute("data-file-drop")).toBe(false);
  });
});

describe("attachFileDrop — collage", () => {
  it("envoie l'image collée à l'unique zone candidate", () => {
    const { input, onChange, detach } = setup(); cleanups.push(detach);
    const paste = pasteEvent([png()]);
    document.dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.files?.[0]?.name).toBe("capture.png");
  });

  it("laisse passer un collage sans fichier (texte) et un fichier non accepté", () => {
    const { onChange, detach } = setup(); cleanups.push(detach);
    const text = pasteEvent([]);
    document.dispatchEvent(text);
    const doc = pasteEvent([pdf()]);
    document.dispatchEvent(doc);
    expect(text.defaultPrevented).toBe(false);
    expect(doc.defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignore une zone désactivée", () => {
    const { onChange, detach } = setup({ disabled: true }); cleanups.push(detach);
    document.dispatchEvent(pasteEvent([png()]));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("avec plusieurs zones, vise celle qui a le focus ; sans focus, ne choisit pas au hasard", () => {
    const a = setup(); const b = setup(); cleanups.push(a.detach, b.detach);
    document.dispatchEvent(pasteEvent([png()]));
    expect(a.onChange).not.toHaveBeenCalled();
    expect(b.onChange).not.toHaveBeenCalled();

    const btn = document.createElement("button");
    b.label.appendChild(btn); btn.focus();
    document.dispatchEvent(pasteEvent([png()]));
    expect(a.onChange).not.toHaveBeenCalled();
    expect(b.onChange).toHaveBeenCalledTimes(1);
  });

  it("n'écoute plus le collage une fois la dernière zone retirée", () => {
    const { onChange, detach } = setup();
    detach();
    document.dispatchEvent(pasteEvent([png()]));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("attachFileDrop — collage dans le chat agent", () => {
  it("une image collée dans le chat agent n'atteint jamais la zone du composer client, même unique candidate", () => {
    const { input, onChange, detach } = setup(); cleanups.push(detach);
    const agent = document.createElement("div"); agent.setAttribute("data-agent-chat", "");
    const field = document.createElement("textarea"); agent.appendChild(field); document.body.appendChild(agent);
    const paste = pasteEvent([png()]);
    field.dispatchEvent(paste);
    expect(onChange).not.toHaveBeenCalled();
    expect(paste.defaultPrevented).toBe(false);
    expect(input.files?.length ?? 0).toBe(0);
  });
});
