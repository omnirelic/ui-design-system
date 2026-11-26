// @vitest-environment jsdom
// DataTable, Pager, usePagination, EmptyState : mêmes classes, tailles, comportements et clavier que web/src/admin/ui de CLP (DataTable.tsx, Pager.tsx, EmptyState.tsx, lib/usePagination.ts).
// CLP n'a pas de test pour ces fichiers : ce sont les garanties de leur code lu ligne à ligne.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DataTable, type DataTableColumn } from "../src/web/DataTable";
import { EmptyState } from "../src/web/EmptyState";
import { PAGE_SIZES, usePagination, type PaginationState } from "../src/web/usePagination";
import { Pager } from "../src/web/Pager";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); document.body.innerHTML = ""; vi.restoreAllMocks(); });
const show = (n: ReactNode) => act(async () => { root.render(n); });

type Row = { id: string; name: string; qty: number };
const rows: Row[] = [{ id: "a", name: "Alpha", qty: 3 }, { id: "b", name: "Beta", qty: 5 }];
const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Nom", render: r => r.name, primary: true },
  { key: "qty", header: "Quantité", render: r => r.qty, align: "right", width: "80px" },
  { key: "x", header: "Caché", render: () => "x", hideOnMobile: true, width: "2fr" },
];
const table = (props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) => createElement(DataTable<Row>, { columns, rows, rowKey: r => r.id, ...props });

describe("DataTable : structure", () => {
  it("rôles table / row / columnheader / cell et un en-tête par colonne", async () => {
    await show(table());
    const t = host.querySelector('[role="table"]') as HTMLElement;
    expect(t.className).toBe("omni-dt");
    expect(host.querySelectorAll('[role="columnheader"]')).toHaveLength(3);
    expect(host.querySelectorAll('[role="row"]')).toHaveLength(3);
    expect(host.querySelectorAll('[role="cell"]')).toHaveLength(6);
    expect(host.querySelector(".omni-dt-scroll")).not.toBeNull();
  });
  it("en-têtes : 12 px (caption), capitales espacées 0,1em, ton atténué ; masqués sur téléphone", async () => {
    await show(table());
    const h = host.querySelector('[role="columnheader"]') as HTMLElement;
    expect(h.className).toContain("omni-dt-hide-sm");
    const span = h.firstElementChild as HTMLElement;
    expect(span.style.fontSize).toBe("0.75rem");
    expect(span.style.textTransform).toBe("uppercase");
    expect(span.style.letterSpacing).toBe("0.1em");
    expect(span.style.color).toContain("var(--o-dim");
  });
  it("alignement par colonne ; étiquette mobile = en-tête texte, absente de la cellule primary", async () => {
    await show(table());
    const cells = host.querySelectorAll('[role="row"]:nth-child(2) [role="cell"]');
    expect((cells[1] as HTMLElement).style.textAlign).toBe("right");
    expect(cells[0].getAttribute("data-label")).toBeNull();
    expect(cells[0].className).toContain("omni-dt-primary");
    expect(cells[1].getAttribute("data-label")).toBe("Quantité");
    expect(cells[2].className).toContain("omni-dt-hide-sm");
  });
  it("gabarit de grille : planchers 112 px (fr / défaut), px conservés, largeur minimale calculée", async () => {
    await show(table());
    const t = host.querySelector('[role="table"]') as HTMLElement;
    expect(t.style.getPropertyValue("--dt-cols")).toBe("minmax(112px, 1fr) 80px minmax(112px, 2fr)");
    expect(t.style.getPropertyValue("--dt-min")).toBe(`${112 + 80 + 112 + 24 + 30}px`);
  });
  it("colonne auto : plancher 160 px dans la largeur minimale", async () => {
    await show(table({ columns: [{ key: "n", header: "N", render: r => r.name, width: "auto" }] }));
    const t = host.querySelector('[role="table"]') as HTMLElement;
    expect(t.style.getPropertyValue("--dt-cols")).toBe("auto");
    expect(t.style.getPropertyValue("--dt-min")).toBe("190px");
  });
});

describe("DataTable : feuille de style", () => {
  const css = () => document.getElementById("omni-dt")!.textContent!;
  it("une seule feuille dans <head>, sans couleur en dur", () => {
    expect(document.head.querySelectorAll("#omni-dt")).toHaveLength(1);
    expect(css().replace(/var\([^)]*\)/g, "")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css()).toContain("var(--o-");
  });
  it("lignes en carte arrondie 8 px, padding 0,625/0,875 rem, gap 12, sous-grille ; cartes empilées sous 640 px", () => {
    expect(css()).toContain("grid-template-columns:subgrid");
    expect(css()).toContain("padding:0.625rem 0.875rem");
    expect(css()).toContain("border-radius:8px");
    expect(css()).toContain("gap:12px");
    expect(css()).toContain("@media (max-width:640px)");
    expect(css()).toContain("content:attr(data-label)");
  });
  it("survol et focus clavier d'une ligne cliquable : filet d'accent", () => {
    expect(css()).toMatch(/\.omni-dt-clickable:hover,\.omni-dt-clickable:focus-visible\{border-color:var\(--o-accent/);
  });
});

describe("DataTable : lignes", () => {
  it("ligne cliquable : tabIndex 0, clic, Entrée et Espace appellent onRowClick", async () => {
    const onRowClick = vi.fn();
    await show(table({ onRowClick }));
    const row = host.querySelectorAll('[role="row"]')[1] as HTMLElement;
    expect(row.tabIndex).toBe(0);
    expect(row.className).toContain("omni-dt-clickable");
    act(() => { row.click(); });
    act(() => { row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); });
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    act(() => { row.dispatchEvent(space); });
    expect(space.defaultPrevented).toBe(true);
    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
  it("sans onRowClick : ligne ni focalisable ni cliquable", async () => {
    await show(table());
    const row = host.querySelectorAll('[role="row"]')[1] as HTMLElement;
    expect(row.tabIndex).toBe(-1);
    expect(row.className).not.toContain("clickable");
  });
  it("sélection (selectedKey) et mise en avant (isHighlighted) : fond teinté 8 %, filet d'accent", async () => {
    await show(table({ selectedKey: "a", isHighlighted: r => r.id === "b" }));
    const [, a, b] = Array.from(host.querySelectorAll<HTMLElement>('[role="row"]'));
    for (const r of [a, b]) {
      expect(r.style.background).toContain("8%");
      expect(r.style.borderColor).toContain("var(--o-accent");
    }
    await show(table());
    const [, a2] = Array.from(host.querySelectorAll<HTMLElement>('[role="row"]'));
    expect(a2.style.background).toContain("var(--o-card");
    expect(a2.style.borderColor).toContain("var(--o-border");
  });
  it("renderExpanded : panneau sous la ligne, null = replié", async () => {
    await show(table({ renderExpanded: r => (r.id === "a" ? createElement("b", null, "détail") : null) }));
    const panels = host.querySelectorAll(".omni-dt-expanded");
    expect(panels).toHaveLength(1);
    expect(panels[0].textContent).toBe("détail");
    expect(panels[0].previousElementSibling?.getAttribute("role")).toBe("row");
  });
});

describe("DataTable : état vide", () => {
  it("aucune ligne : EmptyState, titre « Aucun résultat » par défaut, pas de tableau", async () => {
    await show(table({ rows: [] }));
    expect(host.querySelector('[role="table"]')).toBeNull();
    expect(host.textContent).toBe("Aucun résultat");
  });
  it("titre et indication personnalisés", async () => {
    await show(table({ rows: [], emptyTitle: "Aucun livreur", emptyHint: "Ajoutez-en un" }));
    expect(host.textContent).toContain("Aucun livreur");
    expect(host.textContent).toContain("Ajoutez-en un");
  });
  it("EmptyState : icône 28 px atténuée, titre 15 px gras, indication 13,5 px, action", async () => {
    await show(createElement(EmptyState, { title: "Vide", hint: "Rien ici", action: createElement("button", null, "Créer") }));
    const box = host.firstElementChild as HTMLElement;
    expect(box.style.padding).toBe("2.5rem 1rem");
    expect(box.style.gap).toBe("0.625rem");
    expect(box.querySelector("svg")!.getAttribute("width")).toBe("28");
    const [title, hint] = Array.from(box.querySelectorAll<HTMLElement>("span"));
    expect(title.style.fontSize).toBe("0.9375rem");
    expect(title.style.fontWeight).toBe("700");
    expect(hint.style.fontSize).toBe("0.84375rem");
    expect(box.querySelector("button")!.textContent).toBe("Créer");
  });
});

describe("usePagination", () => {
  function Probe({ items, reset, onState }: { items: number[]; reset?: unknown; onState: (p: PaginationState<number>) => void }) {
    onState(usePagination(items, { pageSize: 10, resetKey: reset }));
    return null;
  }
  const items = Array.from({ length: 95 }, (_, i) => i);
  it("tailles de page de CLP", () => { expect([...PAGE_SIZES]).toEqual([10, 25, 50, 100]); });
  it("découpe, bornes from/to, page bornée, taille qui revient page 1", async () => {
    let p!: PaginationState<number>;
    await show(createElement(Probe, { items, onState: s => { p = s; } }));
    expect([p.pageCount, p.total, p.from, p.to, p.pageItems.length]).toEqual([10, 95, 1, 10, 10]);
    await act(async () => { p.setPage(99); });
    expect([p.page, p.from, p.to, p.pageItems.length]).toEqual([10, 91, 95, 5]);
    await act(async () => { p.setPage(-4); });
    expect(p.page).toBe(1);
    await act(async () => { p.setPage(3); });
    await act(async () => { p.setPageSize(25); });
    expect([p.page, p.pageCount, p.pageSize]).toEqual([1, 4, 25]);
  });
  it("liste vide : from 0, une page ; resetKey change : retour page 1", async () => {
    let p!: PaginationState<number>;
    await show(createElement(Probe, { items: [], onState: s => { p = s; } }));
    expect([p.from, p.to, p.pageCount]).toEqual([0, 0, 1]);
    await show(createElement(Probe, { items, reset: "a", onState: s => { p = s; } }));
    await act(async () => { p.setPage(4); });
    expect(p.page).toBe(4);
    await show(createElement(Probe, { items, reset: "b", onState: s => { p = s; } }));
    expect(p.page).toBe(1);
  });
});

describe("DataTable : pagination intégrée et Pager", () => {
  const many: Row[] = Array.from({ length: 30 }, (_, i) => ({ id: String(i), name: `N${i}`, qty: i }));
  const bodyRows = () => host.querySelectorAll('[role="row"]').length - 1;
  it("sans pageSize : tout affiché, pas de pagination", async () => {
    await show(table({ rows: many }));
    expect(bodyRows()).toBe(30);
    expect(host.querySelector("nav")).toBeNull();
  });
  it("pageSize 10 : 10 lignes, « 1–10 sur 30 », pages 1 2 3, suivant avance, précédent désactivé en page 1", async () => {
    await show(table({ rows: many, pageSize: 10 }));
    expect(bodyRows()).toBe(10);
    const nav = host.querySelector("nav") as HTMLElement;
    expect(nav.getAttribute("aria-label")).toBe("Pagination");
    expect(nav.className).toBe("omni-pager");
    expect(nav.textContent).toContain("1–10 sur 30");
    const [prev, ...rest] = Array.from(nav.querySelectorAll<HTMLButtonElement>(".omni-pager-pages button"));
    expect(prev.disabled).toBe(true);
    expect(rest.filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.textContent)).toEqual(["1"]);
    act(() => { rest[rest.length - 1].click(); });
    expect(nav.textContent).toContain("11–20 sur 30");
    expect(host.textContent).toContain("N10");
  });
  it("trop peu d'éléments pour la plus petite page : Pager absent", async () => {
    await show(table({ rows: rows, pageSize: 10 }));
    expect(host.querySelector("nav")).toBeNull();
  });
  it("fenêtre : 1, courante ±1, dernière, « … » entre les trous", async () => {
    const big = Array.from({ length: 200 }, (_, i) => ({ id: String(i), name: "n", qty: i }));
    await show(table({ rows: big, pageSize: 10 }));
    const label = () => Array.from(host.querySelectorAll(".omni-pager-pages > *")).map(e => e.textContent).join(" ");
    expect(label()).toBe("← 1 2 … 20 →");
    const pages = () => Array.from(host.querySelectorAll<HTMLButtonElement>(".omni-pager-pages button"));
    act(() => { pages().find(b => b.textContent === "2")!.click(); });
    act(() => { pages().find(b => b.textContent === "3")!.click(); });
    act(() => { pages().find(b => b.textContent === "4")!.click(); });
    expect(label()).toBe("← 1 … 3 4 5 … 20 →");
  });
  it("taille de page : menu « 10 / page », choisir 25 revient en page 1", async () => {
    await show(table({ rows: many, pageSize: 10 }));
    const trigger = host.querySelector(".omni-pager-size button") as HTMLElement;
    expect(trigger.getAttribute("aria-label")).toBe("Éléments par page");
    expect(trigger.textContent).toBe("10 / page");
    act(() => { trigger.click(); });
    const opt = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]')).find(o => o.textContent === "25 / page")!;
    act(() => { opt.click(); });
    expect(bodyRows()).toBe(25);
  });
  it("resetKey : changement de filtre, retour page 1", async () => {
    await show(table({ rows: many, pageSize: 10, resetKey: "a" }));
    act(() => { Array.from(host.querySelectorAll<HTMLButtonElement>(".omni-pager-pages button")).pop()!.click(); });
    expect(host.querySelector("nav")!.textContent).toContain("11–20");
    await show(table({ rows: many, pageSize: 10, resetKey: "b" }));
    expect(host.querySelector("nav")!.textContent).toContain("1–10");
  });
  it("Pager autonome : masqué si total ≤ plus petite taille", async () => {
    const p = { page: 1, setPage() {}, pageSize: 10, setPageSize() {}, pageCount: 1, total: 10, from: 1, to: 10, pageItems: [] } as PaginationState<unknown>;
    await show(createElement(Pager, { pagination: p }));
    expect(host.querySelector("nav")).toBeNull();
  });
  it("feuille du Pager : barre qui passe à la ligne, centrée et sans choix de taille sous 640 px", () => {
    const css = document.getElementById("omni-dt")!.textContent!;
    expect(css).toContain(".omni-pager{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px}");
    expect(css).toContain(".omni-pager-size{display:none}");
  });
});

describe("méta-spec : sources du lot 3", () => {
  const files = ["Select", "SearchableSelect", "DataTable", "Pager", "EmptyState", "usePagination", "clp-text", "data-table-css"].map(n => `src/web/${n}.${n === "usePagination" || n === "clp-text" || n === "data-table-css" ? "ts" : "tsx"}`);
  const read = (f: string) => readFileSync(join(__dirname, "..", f), "utf8");
  it.each(files)("%s : aucun hexadécimal en dur, aucun emoji", (f) => {
    const src = read(f).replace(/\/\/.*$/gm, "");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
