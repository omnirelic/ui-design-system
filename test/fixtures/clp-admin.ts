// Le jeu de données de l'espace admin de Chez la Petite (vues, hubs, ressources, anciennes URL, fonctions et réglages indexés par ⌘K), EXPORTÉ depuis le vrai code de CLP
// (web/src/admin/shell/registry.ts, routes.ts, admin-features.ts, settings-schema.ts, origin/dev bb247c29) par test/golden/generate-clp-golden-lot9.ts.txt : jamais retapé.
// C'est la fixture de test du moteur et l'exemple de ce qu'une application fournit ; elle n'est pas livrée dans le paquet.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createAdminRegistry } from "../../src/web/admin-registry";
import type { AdminRegistryConfig } from "../../src/web/admin-registry-types";
import type { PaletteFeature, PaletteSetting } from "../../src/web/admin-palette-model";

const raw = JSON.parse(readFileSync(join(__dirname, "clp-admin-registry.json"), "utf8")) as AdminRegistryConfig & { features: PaletteFeature[]; settings: PaletteSetting[] };

export const CLP_CONFIG: AdminRegistryConfig = {
  views: raw.views, hubs: raw.hubs, resources: raw.resources, groupOrder: raw.groupOrder, legacyPaths: raw.legacyPaths,
  legacyIdPrefixes: raw.legacyIdPrefixes, idPages: raw.idPages, entityLabels: raw.entityLabels,
};
export const CLP_FEATURES = raw.features;
export const CLP_SETTINGS = raw.settings;
export const clpRegistry = () => createAdminRegistry(CLP_CONFIG);

/** Les `gate` de CLP (admin/shell/navGroups.ts) : équipe = admins pleins, superadmin, admin. */
export const clpGateOk = (role: string, manageUsers: boolean) => (gate: string): boolean =>
  gate === "manage-users" ? manageUsers : gate === "superadmin" ? role === "superadmin" : role === "superadmin" || role === "admin";
