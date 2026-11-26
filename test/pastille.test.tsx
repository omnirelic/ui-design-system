import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Pastille } from "../src/web/Pastille";
import { PASTILLE_TONES, STATUS_TONE, formatCount, statusTone, toneColor } from "../src/web/pastille-model";

describe("compteur", () => {
  it("masque 0, absent, négatif ou non fini : jamais une pastille inventée", () => {
    for (const v of [0, null, undefined, -3, NaN, Infinity]) expect(formatCount(v)).toBeNull();
    expect(renderToStaticMarkup(<Pastille variant="count" value={0} />)).toBe("");
  });
  it("plafonne à 99+", () => {
    expect(formatCount(7)).toBe("7");
    expect(formatCount(99)).toBe("99");
    expect(formatCount(100)).toBe("99+");
    expect(formatCount(12, 9)).toBe("9+");
  });
  it("se rend avec son nombre", () => {
    expect(renderToStaticMarkup(<Pastille variant="count" value={5} />)).toContain(">5<");
  });
});

describe("tons", () => {
  it("chaque ton a une couleur ; brand suit --o-accent, les tons sémantiques ne suivent pas la marque", () => {
    for (const t of PASTILLE_TONES) expect(toneColor(t)).toMatch(/^var\(--o-/);
    expect(toneColor("brand")).toContain("--o-accent");
    for (const t of ["success", "warning", "danger", "info"] as const) expect(toneColor(t)).not.toContain("--o-accent");
  });
  it("les statuts du réseau ont un ton ; un statut inconnu reste neutre", () => {
    expect(statusTone("delivered")).toBe("success");
    expect(statusTone("cancelled")).toBe("danger");
    expect(statusTone("pending_payment")).toBe("warning");
    expect(statusTone("inconnu")).toBe("neutral");
    for (const t of Object.values(STATUS_TONE)) expect(PASTILLE_TONES).toContain(t);
  });
});

describe("variantes", () => {
  it("statut : libellé et ton", () => {
    const html = renderToStaticMarkup(<Pastille variant="status" label="Livrée" tone="success" />);
    expect(html).toContain("Livrée");
    expect(html).toContain('data-tone="success"');
  });
  it("donnée : segments séparés par « | »", () => {
    const html = renderToStaticMarkup(<Pastille variant="data" segments={["a", "b", "c"]} />);
    expect(html.match(/\|/g)).toHaveLength(2);
  });
  it("filtre : bouton de retrait nommé", () => {
    const html = renderToStaticMarkup(<Pastille variant="filter" label="Actifs" onRemove={() => {}} />);
    expect(html).toContain('aria-label="Retirer Actifs"');
  });
  it("point : nom accessible", () => {
    expect(renderToStaticMarkup(<Pastille variant="dot" label="Nouveau" />)).toContain('aria-label="Nouveau"');
  });
});
