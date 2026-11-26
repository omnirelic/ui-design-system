import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadDisc } from "../src/web/entry-entity";

describe("LeadDisc — icône teintée toujours lisible", () => {
  it("véhicule bleu marine : la bordure garde la couleur réelle, l'icône est éclaircie", () => {
    const out = renderToStaticMarkup(<LeadDisc lead={{ kind: "icon", icon: "res-vehicles", tint: "#1b2a49" }} />);
    expect(out).toContain("--omni-lead-tint:#1b2a49");
    expect(out).toMatch(/--omni-lead-ink:#[0-9a-f]{6}/);
    expect(out).not.toContain("--omni-lead-ink:#1b2a49");
  });
  it("couleur déjà claire : inchangée", () => {
    expect(renderToStaticMarkup(<LeadDisc lead={{ kind: "icon", icon: "res-vehicles", tint: "#f5c518" }} />)).toContain("--omni-lead-ink:#f5c518");
  });
});
