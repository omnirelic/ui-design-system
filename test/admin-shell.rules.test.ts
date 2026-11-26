// Méta-spec de la coque d'admin :
// (1) aucune couleur en dur (hexadécimal, rgb(), hsl()) ni emoji : tout vient des jetons du thème (noir et blanc par `color-mix`) ;
// (2) le moteur est GÉNÉRIQUE : aucune donnée de CLP (marque, chemins, libellés de vues), aucun réseau ; seul admin-prefs.ts touche le stockage du navigateur ;
// (3) le routeur n'est importé que par admin-shell-router.tsx (et le branchement de `/query-params`) ;
// (4) pas d'infobulle `title` en écho : le seul `title` est l'adresse tronquée du menu de gauche ; chaque bouton icône seule a un nom accessible.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { codeLines } from "../src/web/entity-graph";

const read = (f: string) => readFileSync(join(__dirname, "../src/web", f), "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FUNC = /\b(rgb|rgba|hsl|hsla)\(/;
const EMOJI = /\p{Extended_Pictographic}/u;

const COMPONENTS = ["AdminSidebar.tsx", "AdminHubTabs.tsx", "AdminBreadcrumbs.tsx", "AdminPageHeader.tsx", "AdminSectionRail.tsx", "AdminTopbar.tsx", "AdminSearchTrigger.tsx", "AdminCommandPalette.tsx",
  "AdminLayout.tsx", "AdminViewHost.tsx", "admin-layout-blocks.tsx", "admin-shell-css.ts", "admin-link.tsx", "admin-hub-context.ts"];
const LOGIC = ["admin-registry.ts", "admin-registry-types.ts", "admin-registry-check.ts", "admin-palette-model.ts", "admin-legacy.ts", "admin-prefs.tsx", "admin-night.ts"];
const ROUTER = ["admin-shell-router.tsx"];
const ALL = [...COMPONENTS, ...LOGIC, ...ROUTER];

describe("coque d'admin — jetons de thème seulement", () => {
  for (const f of ALL) {
    it(`${f} : aucune couleur en dur, aucun emoji`, () => {
      const bad = codeLines(read(f)).flatMap((l, i) => (HEX.test(l) || FUNC.test(l) || EMOJI.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
  it("la feuille de la coque n'écrit que des jetons ou des mélanges (`color-mix`) : jamais un nom de couleur de marque", () => {
    const css = codeLines(read("admin-shell-css.ts")).join("\n");
    expect(css).not.toMatch(/\b(gold|orange|red|green|blue)\b/i);
  });
});

describe("coque d'admin — moteur générique, rien de CLP", () => {
  const BRAND = /chez\s*la\s*petite|chezlapetite|\bclp\b/i;
  const CLP_PATHS = /catalog\/(menu|recipes|stock)|orders\/(queue|carts|transactions)|delivery\/(bags|dispatch)|clients\/(influencers|abuse)|team\/roles|system\/(settings|monitoring)/;
  for (const f of [...COMPONENTS, ...LOGIC, ...ROUTER]) {
    it(`${f} : ni marque, ni chemin, ni identifiant de vue de CLP`, () => {
      const bad = codeLines(read(f)).flatMap((l, i) => (BRAND.test(l) || CLP_PATHS.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
  it("aucun réseau", () => {
    const NET = /\bfetch\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket|import\.meta\.env|process\.env/;
    expect(ALL.filter(f => codeLines(read(f)).some(l => NET.test(l)))).toEqual([]);
  });
  it("seul admin-prefs.ts lit ou écrit le stockage du navigateur, par clé préfixée par l'application", () => {
    const STORE = /localStorage|sessionStorage|indexedDB|document\.cookie/;
    expect(ALL.filter(f => codeLines(read(f)).some(l => STORE.test(l)))).toEqual(["admin-prefs.tsx"]);
    const prefs = codeLines(read("admin-prefs.tsx")).join("\n");
    expect(prefs).toMatch(/\$\{storagePrefix\}_font_scale/);
    expect(prefs).toMatch(/\$\{storagePrefix\}_sidebar_collapsed/);
  });
  it("les tables de recherche du registre n'ont pas de prototype (/admin/constructor ne doit jamais être une vue)", () => {
    const src = codeLines(read("admin-registry.ts")).join("\n");
    expect(src).toMatch(/Object\.create\(null\)/);
    expect(src).not.toMatch(/Object\.fromEntries\(DEFS/);
  });
});

describe("coque d'admin — routeur à part", () => {
  it("seul admin-shell-router.tsx importe react-router-dom parmi les fichiers de la coque", () => {
    const withRouter = ALL.filter(f => codeLines(read(f)).some(l => /from ["']react-router/.test(l)));
    expect(withRouter).toEqual(["admin-shell-router.tsx"]);
  });
  it("le sous-chemin /admin-shell n'exporte rien qui exige le routeur", () => {
    expect(codeLines(read("entry-admin-shell.ts")).join("\n")).not.toMatch(/admin-shell-router|react-router/);
  });
  it("le sous-chemin /admin-shell-router n'exporte que les quatre branchements", () => {
    expect([...read("entry-admin-shell-router.ts").matchAll(/export \{ ([^}]+) \}/g)].flatMap(m => m[1].split(",").map(s => s.trim()))).toEqual(["AdminRouterLinks", "ViewBreadcrumbs", "useAdminLocation", "useLegacyRedirect"]);
  });
});

describe("coque d'admin — interface sobre et accessible", () => {
  it("seul AdminSidebar.tsx pose un `title` : l'adresse tronquée de la personne connectée", () => {
    const withTitle = ALL.flatMap(f => codeLines(read(f)).filter(l => /<[a-z]+\b[^>]*\btitle=/.test(l)).map(l => `${f}: ${l.trim()}`));
    expect(withTitle).toHaveLength(1);
    expect(withTitle[0]).toMatch(/^AdminSidebar\.tsx: .*title=\{email\}/);
  });
  it("aucune infobulle ne répète un libellé visible : les boutons libellés n'ont pas d'infobulle", () => {
    // « Agrandir » / « Réduire » porte une infobulle qui dit l'EFFET (comme CLP), jamais le mot seul.
    const topbar = codeLines(read("AdminTopbar.tsx")).join("\n");
    expect(topbar).toContain('"Réduire : afficher le menu"');
    expect(topbar).toContain('"Agrandir : masquer le menu de gauche"');
  });
  it("les entrées du menu de gauche portent aria-current ; la barre d'onglets est une tablist étiquetée ; le rail est un tablist vertical", () => {
    expect(read("AdminSidebar.tsx")).toMatch(/aria-current=\{active \? "page" : undefined\}/);
    expect(read("AdminHubTabs.tsx")).toMatch(/role="tablist" aria-label=\{hub\.label\}/);
    expect(read("AdminSectionRail.tsx")).toMatch(/role="tablist" aria-orientation="vertical"/);
  });
});

describe("feuille de la coque", () => {
  it("chaque fichier qui emploie une classe omni-shell importe la feuille (sinon elle n'est jamais injectée)", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(__dirname, "../src/web");
    const users = readdirSync(dir).filter(f => /^(Admin|admin-layout)[\w-]*\.tsx$/.test(f) && /omni-shell/.test(readFileSync(join(dir, f), "utf8")));
    expect(users.length).toBeGreaterThanOrEqual(7);
    for (const f of users) expect(readFileSync(join(dir, f), "utf8"), f).toMatch(/import "\.\/admin-shell-css";/);
  });
});
