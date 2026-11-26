// @vitest-environment jsdom
// Alert, Spinner, Skeleton, Pagination, ConfirmDialog, CopyButton, Icon : mêmes props, états, tailles et comportements que Chez la Petite.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Alert } from "../src/web/Alert";
import { Pagination } from "../src/web/Pagination";
import { Spinner } from "../src/web/Spinner";
import { Sk, SkBar, SkGrid, SkRows, SkTable } from "../src/web/Skeleton";
import { ConfirmDialog } from "../src/web/ConfirmDialog";
import { CopyButton } from "../src/web/CopyButton";
import { Icon } from "../src/web/Icon";
import { ICONS } from "../src/web/icon-registry";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });
const show = (n: ReactNode) => act(async () => { root.render(n); });
const q = <T extends Element = HTMLElement>(s: string) => document.body.querySelector<T>(s)!;

describe("Alert", () => {
  it.each([["success", "success"], ["warning", "warning"], ["error", "danger"], ["info", "accent"]] as const)("%s : couleur du thème, fond 9 %%, filet 27 %%", async (type, token) => {
    await show(createElement(Alert, { type, message: "Texte" }));
    const box = host.firstElementChild as HTMLElement;
    expect(box.style.color).toContain(`var(--o-${token}`);
    expect(box.style.background).toContain("9%");
    expect(box.style.border).toContain("27%");
    expect(box.style.padding).toBe("10px 14px");
    expect(box.style.borderRadius).toBe("6px");
    expect(box.textContent).toBe("Texte");
  });
  it("sans onClose : pas de croix ; avec : la croix appelle onClose", async () => {
    await show(createElement(Alert, { type: "info", message: "m" }));
    expect(host.querySelector("button")).toBeNull();
    const onClose = vi.fn();
    await show(createElement(Alert, { type: "info", message: "m", onClose }));
    act(() => { host.querySelector("button")!.click(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Pagination", () => {
  const labels = () => [...host.querySelectorAll("button")].map((b) => b.textContent);
  it("une seule page : rien", async () => {
    await show(createElement(Pagination, { page: 1, totalPages: 1, onChange: () => {} }));
    expect(host.innerHTML).toBe("");
  });
  it("fenêtre : 1, voisins de la page courante, dernière, avec … ", async () => {
    await show(createElement(Pagination, { page: 5, totalPages: 12, onChange: () => {} }));
    expect(labels()).toEqual(["←", "1", "4", "5", "6", "12", "→"]);
    expect(host.textContent).toContain("…");
  });
  it("première page : ← désactivé ; dernière : → désactivé ; page courante teintée", async () => {
    await show(createElement(Pagination, { page: 1, totalPages: 3, onChange: () => {} }));
    const b = [...host.querySelectorAll("button")];
    expect(b[0].disabled).toBe(true);
    expect(b[1].style.opacity).toBe("1");
    expect(b[1].style.border).toContain("var(--o-accent");
    await show(createElement(Pagination, { page: 3, totalPages: 3, onChange: () => {} }));
    expect([...host.querySelectorAll("button")].at(-1)!.disabled).toBe(true);
  });
  it("clics : page précédente / suivante / numéro", async () => {
    const onChange = vi.fn();
    await show(createElement(Pagination, { page: 2, totalPages: 3, onChange }));
    const b = [...host.querySelectorAll("button")];
    act(() => { b[0].click(); b[3].click(); b[4].click(); });
    expect(onChange.mock.calls).toEqual([[1], [3], [3]]);
  });
});

describe("Spinner et squelettes", () => {
  it("Spinner : 24 px par défaut, anneau 2 px, 0,7 s ; taille et couleur réglables", async () => {
    await show(createElement(Spinner, {}));
    const ring = (host.firstElementChild!.firstElementChild as HTMLElement);
    expect(ring.style.width).toBe("24px");
    expect(ring.style.animation).toContain("0.7s linear infinite");
    expect(renderToStaticMarkup(createElement(Spinner, {}))).toContain("border:2px solid color-mix"); // jsdom ignore color-mix dans un shorthand
    await show(createElement(Spinner, { size: 12, color: "red" }));
    expect((host.firstElementChild!.firstElementChild as HTMLElement).style.width).toBe("12px");
    expect((host.firstElementChild!.firstElementChild as HTMLElement).style.borderTopColor).toBe("red");
  });
  it("Sk : 100 % × 14 px par défaut, reflet 1,4 s ; keyframe posé une fois dans <head>", async () => {
    await show(createElement(Sk, {}));
    const sk = host.firstElementChild as HTMLElement;
    expect(sk.style.width).toBe("100%"); expect(sk.style.height).toBe("14px"); expect(sk.style.animation).toContain("1.4s");
    expect(document.querySelectorAll("#omni-sk")).toHaveLength(1);
  });
  it("SkRows n lignes ; SkTable lignes × colonnes ; SkGrid n cartes ; SkBar 36 px", async () => {
    await show(createElement(SkRows, { n: 5 }));
    expect(host.firstElementChild!.children).toHaveLength(5);
    await show(createElement(SkTable, { rows: 3, cols: 4 }));
    const table = host.firstElementChild!;
    expect(table.children[0].children).toHaveLength(4);
    expect(table.children[1].children).toHaveLength(3);
    await show(createElement(SkGrid, { cards: 4, cardH: 90 }));
    expect(host.firstElementChild!.children).toHaveLength(4);
    expect((host.firstElementChild!.children[0] as HTMLElement).style.height).toBe("90px");
    await show(createElement(SkBar, {}));
    expect((host.firstElementChild as HTMLElement).style.height).toBe("36px");
  });
});

describe("ConfirmDialog", () => {
  const props = { title: "Annuler", message: "Sûr ?", onConfirm: () => {}, onCancel: () => {} };
  it("fermé : rien ; ouvert : titre, message, Annuler et Confirmer (libellé par défaut)", async () => {
    await show(createElement(ConfirmDialog, { ...props, open: false }));
    expect(host.innerHTML).toBe("");
    await show(createElement(ConfirmDialog, { ...props, open: true }));
    const text = document.body.textContent!;
    expect(text).toContain("Annuler"); expect(text).toContain("Sûr ?");
    expect([...document.querySelectorAll("button")].map((b) => b.textContent)).toContain("Confirmer");
  });
  it("danger : bouton danger ; sinon primaire ; libellé personnalisé", async () => {
    await show(createElement(ConfirmDialog, { ...props, open: true, danger: true, confirmLabel: "Supprimer" }));
    expect(q("button.omni-btn--danger").textContent).toBe("Supprimer");
    await show(createElement(ConfirmDialog, { ...props, open: true }));
    expect(q("button.omni-btn--primary").textContent).toBe("Confirmer");
  });
  it("loading : confirmer désactivé et occupé ; initialFocus donne le focus au bon bouton", async () => {
    await show(createElement(ConfirmDialog, { ...props, open: true, loading: true }));
    expect(q<HTMLButtonElement>("button.omni-btn--primary").disabled).toBe(true);
    expect(q("button.omni-btn--primary").getAttribute("aria-busy")).toBe("true");
    await show(createElement(ConfirmDialog, { ...props, open: false }));
    await show(createElement(ConfirmDialog, { ...props, open: true, initialFocus: "cancel" }));
    expect(document.activeElement?.textContent).toBe("Annuler");
    expect(document.activeElement?.tagName).toBe("BUTTON");
  });
  it("clics et Échap : onConfirm, onCancel ; z-index relevable ; largeur 420", async () => {
    const onConfirm = vi.fn(); const onCancel = vi.fn();
    await show(createElement(ConfirmDialog, { ...props, open: true, onConfirm, onCancel, zIndex: 1400 }));
    act(() => { q("button.omni-btn--primary").click(); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    act(() => { [...document.querySelectorAll("button")].find((b) => b.textContent === "Annuler")!.click(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(onCancel.mock.calls.length).toBeGreaterThanOrEqual(2);
    const overlay = document.body.querySelector<HTMLElement>("div[style*='z-index']")!;
    expect(overlay.style.zIndex).toBe("1400");
    expect((overlay.firstElementChild as HTMLElement).style.maxWidth).toBe("420px");
  });
});

describe("CopyButton", () => {
  const clip = () => { const writeText = vi.fn().mockResolvedValue(undefined); Object.assign(navigator, { clipboard: { writeText } }); return writeText; };
  const click = (el: Element) => act(async () => { (el as HTMLElement).click(); await Promise.resolve(); });
  it("icône seule : tooltip « Copier » par défaut, copie, devient « Copié » + coche puis revient après 1,8 s", async () => {
    vi.useFakeTimers();
    const writeText = clip();
    await show(createElement(CopyButton, { text: "CMD-1" }));
    const btn = q("button");
    expect(btn.getAttribute("title")).toBe("Copier"); expect(btn.getAttribute("aria-label")).toBe("Copier");
    await click(btn);
    expect(writeText).toHaveBeenCalledWith("CMD-1");
    expect(q("button").getAttribute("title")).toBe("Copié");
    expect(q("button").className).toContain("omni-copied");
    await act(async () => { vi.advanceTimersByTime(1800); });
    expect(q("button").getAttribute("title")).toBe("Copier");
    vi.useRealTimers();
  });
  it("libellé : « Copié » à la place du libellé ; texte différé évalué au clic ; le clic ne se propage pas", async () => {
    const writeText = clip(); const parent = vi.fn();
    const getText = vi.fn(() => "au clic");
    await show(createElement("div", { onClick: parent }, createElement(CopyButton, { text: getText, label: "Copier le lien" })));
    expect(getText).not.toHaveBeenCalled();
    expect(q("button").textContent).toBe("Copier le lien");
    await click(q("button"));
    expect(writeText).toHaveBeenCalledWith("au clic");
    expect(q("button").textContent).toBe("Copié");
    expect(parent).not.toHaveBeenCalled();
  });
  it("wide : libellé à gauche, pleine largeur, icône « copier » à droite avec trailing ; désactivé : tooltip dédié", async () => {
    await show(createElement(CopyButton, { text: "x", label: "Copier", wide: true, trailing: true, disabled: true, tooltip: "Copier", disabledTooltip: "Rien à copier" }));
    const btn = q<HTMLButtonElement>("button");
    expect(btn.style.width).toBe("100%"); expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("title")).toBe("Rien à copier");
    expect(btn.querySelectorAll("svg")).toHaveLength(2);
  });
});

describe("Icon et registre", () => {
  it("défauts CLP : 20 px, graisse light, flexShrink 0 ; taille et graisse réglables", async () => {
    await show(createElement(Icon, { name: "action-close" }));
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("20");
    expect(svg.style.flexShrink).toBe("0");
    await show(createElement(Icon, { name: "action-close", size: 32, weight: "bold" }));
    expect(host.querySelector("svg")!.getAttribute("width")).toBe("32");
  });
  it("sans ton : hérite de currentColor ; avec ton : variable du thème ; `color` gagne", async () => {
    await show(createElement(Icon, { name: "action-add" }));
    expect(host.querySelector("svg")!.getAttribute("fill")).toBe("currentColor");
    await show(createElement(Icon, { name: "status-error" }));
    expect(host.querySelector("svg")!.getAttribute("fill")).toContain("var(--o-danger");
    await show(createElement(Icon, { name: "status-error", color: "red" }));
    expect(host.querySelector("svg")!.getAttribute("fill")).toBe("red");
  });
  it("noms préfixés par famille, minuscules, sans doublon ; familles de CLP présentes", () => {
    const names = Object.keys(ICONS);
    expect(names.filter((n) => !/^(nav|res|action|step|ui|status|state|service|loc|kind|pay)-[a-z0-9-]+$/.test(n))).toEqual([]);
    for (const n of ["action-close", "action-copy", "status-check", "status-success", "status-warning", "status-error", "status-info", "res-orders", "ui-chevron-down", "step-delivered"]) expect(names).toContain(n);
    expect(names.length).toBeGreaterThan(200);
  });
});

describe("règles du portage", () => {
  const dir = join(__dirname, "..", "src", "web");
  const files = ["Drawer", "Alert", "Spinner", "Skeleton", "Pagination", "ConfirmDialog", "CopyButton", "controls", "Icon", "icon-registry"].map((f) => [f, readFileSync(join(dir, `${f}.${f === "icon-registry" ? "ts" : "tsx"}`), "utf8")] as const);
  it.each(files)("%s : aucune couleur hexadécimale en dur", (_n, src) => {
    const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
  it.each(files)("%s : aucun emoji", (_n, src) => { expect(src).not.toMatch(/\p{Extended_Pictographic}/u); });
  it("readdirSync lit bien le dossier", () => { expect(readdirSync(dir).length).toBeGreaterThan(20); });
});
