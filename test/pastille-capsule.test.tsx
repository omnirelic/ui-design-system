// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EntityRefProvider, LeadDisc, PastilleBox, PastilleCapsule, arrangeSegments, leadFor } from "../src/web/entry-entity";
import { ENTITY_DEFS, clpGraph } from "./fixtures/clp-entities";

// Tests de web/src/admin/ui/pastille/__tests__/pastille-render.test.tsx de CLP (sans GluedPastilles ni QUALIFIERS, non repris ; l'argent passe par `formatMoney` du fournisseur).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; });

function mount(el: ReactElement): HTMLDivElement {
  host = document.createElement("div"); document.body.appendChild(host);
  root = createRoot(host); act(() => root!.render(el));
  return host;
}
const flat = (t: string | null) => (t ?? "").replace(/\s/g, " ");
const order = arrangeSegments([{ role: "label", text: "#0765", strong: true }, { role: "state", text: "En attente", dot: "#FF9800" }, { role: "value", money: 19000 }, { role: "when", text: "14:12" }]);
const orderLead = <LeadDisc lead={leadFor(ENTITY_DEFS.order)} />;
const loyal = { label: "Fidèle", icon: "ui-seal-check", tone: "gold" } as const;
const nouveau = { label: "Nouveau", icon: "ui-sparkle", tone: "green" } as const;

describe("PastilleCapsule — forme pastille", () => {
  it("commence par son disque de tête, puis les segments dans l'ordre, chacun avec sa position", () => {
    const el = mount(<PastilleCapsule lead={orderLead} segments={order} />).querySelector(".omni-pst")!;
    expect(el.firstElementChild!.classList.contains("omni-pst-lead")).toBe(true);
    const sgs = [...el.querySelectorAll(".omni-pst-sg")];
    expect(sgs.map(s => s.getAttribute("data-pos"))).toEqual(["1", "2", "3", "4"]);
    expect(sgs.map(s => s.className.replace("omni-pst-sg omni-pst-sg--", ""))).toEqual(["label", "state", "value", "when"]);
  });

  it("l'argent : XAF entier par défaut, ou le formateur du fournisseur (devise de l'application)", () => {
    expect(flat(mount(<PastilleCapsule lead={orderLead} segments={order} />).querySelector(".omni-pst-sg--value")!.textContent)).toBe("19 000 XAF");
    act(() => root!.unmount()); host!.remove();
    const h = mount(<EntityRefProvider value={{ graph: clpGraph, formatMoney: (v) => `$${(v / 565).toFixed(2)}` }}><PastilleCapsule lead={orderLead} segments={order} /></EntityRefProvider>);
    expect(h.querySelector(".omni-pst-sg--value")!.textContent).toBe("$33.63");
  });

  it("le point d'état se pose devant le texte de l'état", () => {
    const sd = mount(<PastilleCapsule lead={orderLead} segments={order} />).querySelector(".omni-pst-sg--state .omni-pst-sd") as HTMLElement;
    expect(sd.style.background).not.toBe("");
  });

  it("le badge est le DERNIER segment, avec son icône et son mot — sans infobulle en écho", () => {
    const el = mount(<PastilleCapsule lead={orderLead} segments={order} qualifier={nouveau} />).querySelector(".omni-pst")!;
    const q = el.lastElementChild as HTMLElement;
    expect(q.className).toContain("omni-pst-q--green");
    expect(q.hasAttribute("title")).toBe(false);
    expect(q.getAttribute("aria-label")).toBe("Nouveau");
    expect(q.getAttribute("data-label")).toBe("Nouveau");
    expect(q.querySelector("svg")).not.toBeNull();
    expect(q.querySelector(".omni-pst-ql")!.textContent).toBe("Nouveau");
  });

  it("aucune infobulle : le texte est déjà à l'écran, le reste est dans la fiche rapide", () => {
    expect(mount(<PastilleCapsule lead={orderLead} segments={order} qualifier={loyal} />).querySelector("[title]")).toBeNull();
  });

  it("le fond d'accent est une option", () => {
    expect(mount(<PastilleCapsule lead={orderLead} segments={order} gold />).querySelector(".omni-pst--gold")).not.toBeNull();
  });
});

describe("PastilleCapsule — formes compacte et point", () => {
  it("compacte : disque + libellé, dans une capsule (bordure), sans les autres segments ni infobulle", () => {
    const el = mount(<PastilleCapsule form="compact" lead={orderLead} segments={order} />).querySelector(".omni-pst--compact")!;
    expect(el.hasAttribute("title")).toBe(false);
    expect(el.textContent).toBe("#0765");
    expect(el.querySelector(".omni-pst-sg")).toBeNull();
  });

  it("point : le disque seul, son nom en infobulle (seule forme sans texte), le point d'état par-dessus", () => {
    const el = mount(<PastilleCapsule form="point" lead={<LeadDisc lead={leadFor(ENTITY_DEFS.order)} size="md" />} segments={order} stateDot="#FF9800" />).querySelector(".omni-pst--point")!;
    expect(el.textContent).toBe("");
    expect(el.getAttribute("title")).toBe("#0765");
    expect((el.querySelector(".omni-pst-dot") as HTMLElement).style.background).not.toBe("");
  });
});

describe("LeadDisc", () => {
  it("personne : la photo quand elle existe, les initiales sinon", () => {
    expect(mount(<LeadDisc lead={leadFor(ENTITY_DEFS.client)} name="Nathalie Diane" photoUrl="https://x.test/a.jpg" />).querySelector("img")!.getAttribute("src")).toBe("https://x.test/a.jpg");
    act(() => root!.unmount()); host!.remove();
    expect(mount(<LeadDisc lead={leadFor(ENTITY_DEFS.client)} name="Nathalie Diane" />).textContent).toBe("ND");
  });
  it("chose : l'icône du type ; le sac prend sa vraie couleur", () => {
    const disc = mount(<LeadDisc lead={leadFor(ENTITY_DEFS.bag, { color: "#2BB673" })} />).querySelector(".omni-pst-lead") as HTMLElement;
    expect(disc.querySelector("svg")).not.toBeNull();
    expect(disc.className).toContain("omni-pst-lead--tint");
    expect(disc.style.getPropertyValue("--omni-lead-tint")).toBe("#2BB673");
  });
});

describe("paliers de compacité", () => {
  const css = readFileSync(join(__dirname, "../src/web/entity-css.ts"), "utf8");
  it("PastilleBox est le conteneur nommé « pst »", () => {
    expect(mount(<PastilleBox><span /></PastilleBox>).querySelector(".omni-pst-box")).not.toBeNull();
    expect(css).toMatch(/\.omni-pst-box\{[^}]*container:pst \/ inline-size/);
  });
  it("le mot du badge n'apparaît au survol que lorsqu'il a disparu de l'écran", () => {
    expect(css).toMatch(/@container pst \(max-width:460px\)\{[^}]*\.omni-pst-q:hover::after[^}]*attr\(data-label\)/);
    expect(css).not.toMatch(/^\.omni-pst-q:hover::after/m);
  });
  it("les paliers de CLP par largeur de conteneur : 520, 460, 400, 270, 190", () => {
    const widths = [...css.matchAll(/@container pst \(max-width:(\d+)px\)/g)].map(m => Number(m[1]));
    for (const w of [520, 460, 400, 270, 190]) expect(widths, `palier ${w}`).toContain(w);
  });
  it("le « quand » (segment 4) part en premier, le premier segment ne part jamais", () => {
    expect(css).toMatch(/@container pst \(max-width:520px\)\{[^}]*data-pos="4"[^}]*display:none/);
    expect(css).not.toMatch(/data-pos="1"\]\s*\{\s*display:\s*none/);
  });
});
