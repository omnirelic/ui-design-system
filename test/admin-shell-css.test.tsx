// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("feuille de la coque", () => {
  it("importer la coque injecte la feuille une seule fois dans <head>", async () => {
    await import("../src/web/AdminLayout");
    await import("../src/web/AdminSidebar");
    expect(document.querySelectorAll("style#omni-shell").length).toBe(1);
    expect(document.getElementById("omni-shell")!.textContent).toContain(".omni-shell-root");
  });
});
