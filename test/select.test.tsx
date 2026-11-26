// @vitest-environment jsdom
// Select : miroir de web/src/ui/__tests__/Select.test.tsx de CLP (panneau en portail, largeur, recherche, clavier) + ajouts propres au paquet (jetons, placeholder, option épinglée, alias SearchableSelect).
import { describe, it, expect, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { Select } from "../src/web/Select";
import { SearchableSelect } from "../src/web/SearchableSelect";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = [{ value: "", label: "— Aucun —" }, { value: "1", label: "MP" }, { value: "2", label: "François" }];
let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount() {
  host = document.createElement("div");
  // Parent qui rogne : l'ancien panneau absolu aurait été coupé ici.
  host.style.overflow = "hidden";
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root!.render(<Select options={options} value="" onChange={() => {}} ariaLabel="Livreur" />); });
}

afterEach(() => {
  act(() => { root?.unmount(); });
  host?.remove();
  root = null; host = null;
});

describe("Select", () => {
  it("rend le panneau dans document.body (hors du conteneur qui rogne), avec toutes les options", () => {
    mount();
    act(() => { host!.querySelector("button")!.click(); });
    const panel = document.body.querySelector('[role="listbox"]') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(host!.contains(panel)).toBe(false);
    expect(panel.style.position).toBe("fixed");
    expect(panel.querySelectorAll('[role="option"]')).toHaveLength(3);
  });

  it("se ferme après le choix d'une option", () => {
    mount();
    act(() => { host!.querySelector("button")!.click(); });
    act(() => { (document.body.querySelectorAll('[role="option"]')[1] as HTMLElement).click(); });
    expect(document.body.querySelector('[role="listbox"]')).toBeNull();
  });
});

describe("Select width", () => {
  it("plafonne la largeur du déclencheur quand `width` est fourni (barres de filtres)", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root!.render(<Select options={options} value="" onChange={() => {}} width={200} />); });
    expect((host.firstElementChild as HTMLElement).style.maxWidth).toBe("200px");
  });
});

describe("Select searchable", () => {
  function open() {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root!.render(<Select searchable options={options} value="" onChange={() => {}} ariaLabel="Plat" />); });
    act(() => { host!.querySelector("button")!.click(); });
  }
  const type = (v: string) => {
    const input = document.body.querySelector('input[type="search"]') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  it("filtre les options à la frappe, sans tenir compte des accents ni de la casse", () => {
    open();
    type("FRANCO");
    expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(document.body.querySelector('[role="option"]')!.textContent).toBe("François");
  });

  it("affiche « Aucun résultat » quand rien ne correspond, et repart de zéro à la réouverture", () => {
    open();
    type("zzz");
    expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(document.body.textContent).toContain("Aucun résultat");
    act(() => { host!.querySelector("button")!.click(); });
    act(() => { host!.querySelector("button")!.click(); });
    expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(3);
  });

  it("sans `searchable`, aucun champ de recherche", () => {
    mount();
    act(() => { host!.querySelector("button")!.click(); });
    expect(document.body.querySelector('input[type="search"]')).toBeNull();
  });
});

describe("Select au clavier", () => {
  const key = (el: Element, k: string) => act(() => { el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })); });
  const open = () => {
    mount();
    const trigger = host!.querySelector("button") as HTMLElement;
    key(trigger, "ArrowDown");
    return trigger;
  };

  it("flèche bas sur le déclencheur ouvre le menu et place le focus sur l'option choisie", () => {
    open();
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
    expect(document.activeElement?.getAttribute("role")).toBe("option");
    expect(document.activeElement?.textContent).toContain("Aucun");
  });

  it("flèches, Fin, Début : le focus suit ; Entrée choisit et rend le focus au déclencheur", () => {
    const trigger = open();
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.textContent).toBe("MP");
    key(document.activeElement!, "End");
    expect(document.activeElement?.textContent).toBe("François");
    key(document.activeElement!, "Home");
    expect(document.activeElement?.textContent).toContain("Aucun");
    key(document.activeElement!, "ArrowUp");
    expect(document.activeElement?.textContent).toContain("Aucun");
    key(document.activeElement!, "ArrowDown");
    key(document.activeElement!, "Enter");
    expect(document.body.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("Échap ferme et rend le focus au déclencheur", () => {
    const trigger = open();
    key(document.activeElement!, "Escape");
    expect(document.body.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("anneau de focus : plus d'outline supprimé sur le déclencheur", () => {
    mount();
    expect((host!.querySelector("button") as HTMLElement).style.outline).toBe("");
  });
});

describe("Select : jetons du thème (zéro couleur en dur)", () => {
  it("déclencheur et panneau n'emploient que des variables --o-*", () => {
    mount();
    const trigger = host!.querySelector("button") as HTMLElement;
    expect(trigger.style.border).toContain("var(--o-border");
    act(() => { trigger.click(); });
    expect(trigger.style.border).toContain("var(--o-accent");
    const panel = document.body.querySelector('[role="listbox"]') as HTMLElement;
    for (const el of [trigger, panel, ...Array.from(panel.querySelectorAll<HTMLElement>("[role=option]"))]) {
      expect((el.getAttribute("style") ?? "").replace(/var\([^)]*\)/g, "")).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
    expect(panel.style.background).toContain("var(--o-card");
  });
  it("géométrie de CLP : rayon 8, padding 10/10/10/12, police 13, panneau 220 px max, étage 10000", () => {
    mount();
    const trigger = host!.querySelector("button") as HTMLElement;
    expect(trigger.style.borderRadius).toBe("8px");
    expect(trigger.style.padding).toBe("10px 10px 10px 12px");
    expect(trigger.style.fontSize).toBe("0.8125rem");
    act(() => { trigger.click(); });
    const panel = document.body.querySelector('[role="listbox"]') as HTMLElement;
    expect(panel.style.zIndex).toBe("10000");
    expect(Number.parseInt(panel.style.maxHeight)).toBeLessThanOrEqual(220);
  });
  it("uiSize sm : padding 7 px, police 12 ; height fixe remplace le padding vertical", () => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<Select options={options} value="" onChange={() => {}} uiSize="sm" />); });
    const b = host.querySelector("button") as HTMLElement;
    expect(b.style.padding).toBe("7px 10px 7px 12px");
    expect(b.style.fontSize).toBe("0.75rem");
    act(() => { root!.render(<Select options={options} value="" onChange={() => {}} height={48} />); });
    expect(b.style.height).toBe("48px");
    expect(b.style.padding).toBe("0px 10px 0px 12px");
  });
});

describe("Select : icône, désactivé, placeholder, option épinglée", () => {
  it("variante icône : déclencheur réduit, titre = libellé du filtre actif, panneau ancré à droite", () => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<Select options={options} value="1" onChange={() => {}} icon="ui-chevron-down" ariaLabel="Livreur" />); });
    const b = host.querySelector("button") as HTMLElement;
    expect(b.title).toBe("Livreur : MP");
    expect(b.textContent).toBe("");
    act(() => { b.click(); });
    expect((document.body.querySelector('[role="listbox"]') as HTMLElement).style.right).not.toBe("");
  });
  it("désactivé : ne s'ouvre pas", () => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<Select options={options} value="" onChange={() => {}} disabled />); });
    act(() => { host!.querySelector("button")!.click(); });
    expect(document.body.querySelector('[role="listbox"]')).toBeNull();
  });
  it("option désactivée : non choisissable, sautée au clavier", () => {
    const seen: string[] = [];
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<Select options={[{ value: "a", label: "A" }, { value: "b", label: "B", disabled: true }, { value: "c", label: "C" }]} value="a" onChange={v => seen.push(v)} />); });
    act(() => { host!.querySelector("button")!.click(); });
    act(() => { (document.body.querySelectorAll('[role="option"]')[1] as HTMLElement).click(); });
    expect(seen).toEqual([]);
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
    const el = document.activeElement!;
    act(() => { el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); });
    expect(document.activeElement?.textContent).toBe("C");
  });
  it("placeholder affiché sans sélection (ajout)", () => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<Select options={[{ value: "a", label: "A" }]} value="" onChange={() => {}} placeholder="Choisir…" />); });
    expect(host.querySelector("button")!.textContent).toBe("Choisir…");
  });
  it("option épinglée : reste visible pendant la recherche (ajout)", () => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<Select searchable options={[{ value: "a", label: "Alpha" }, { value: "n", label: "+ Nouvelle", pinned: true }]} value="" onChange={() => {}} />); });
    act(() => { host!.querySelector("button")!.click(); });
    const input = document.body.querySelector('input[type="search"]') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "zzz");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect([...document.body.querySelectorAll('[role="option"]')].map(o => o.textContent)).toEqual(["+ Nouvelle"]);
  });
});

describe("SearchableSelect (alias déprécié, API omnirelic conservée)", () => {
  const opts = [{ value: "douala", label: "Douala", sub: "Littoral" }, { value: "yaounde", label: "Yaoundé", sub: "Centre" }];
  it("value null : placeholder ; choix : onChange(value) ; recherche aussi sur le sous-libellé", () => {
    const seen: string[] = [];
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<SearchableSelect value={null} onChange={v => seen.push(v)} options={opts} />); });
    const trigger = host.querySelector("button") as HTMLElement;
    expect(trigger.textContent).toBe("Choisir…");
    act(() => { trigger.click(); });
    const input = document.body.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input.placeholder).toBe("Rechercher…");
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "centre");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const shown = [...document.body.querySelectorAll('[role="option"]')];
    expect(shown).toHaveLength(1);
    expect(shown[0].textContent).toContain("Yaoundé");
    act(() => { (shown[0] as HTMLElement).click(); });
    expect(seen).toEqual(["yaounde"]);
  });
  it("pinnedOption : toujours en bas de liste, même sans correspondance", () => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    act(() => { root!.render(<SearchableSelect value="douala" onChange={() => {}} options={opts} pinnedOption={{ value: "__new", label: "+ Nouvelle succursale…" }} searchPlaceholder="Chercher" />); });
    expect(host.querySelector("button")!.textContent).toContain("Douala");
    act(() => { host!.querySelector("button")!.click(); });
    const all = [...document.body.querySelectorAll('[role="option"]')];
    expect(all[all.length - 1].textContent).toContain("+ Nouvelle succursale…");
    expect((document.body.querySelector('input[type="search"]') as HTMLInputElement).placeholder).toBe("Chercher");
  });
});
