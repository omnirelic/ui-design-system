import type { CatalogFixturesInterface } from "./types";

export const CATALOG_FIXTURES: CatalogFixturesInterface = {
  now: Date.UTC(2026, 10, 25, 13, 0),
  timeZone: "Africa/Douala",
  locale: "fr",
  person: { name: "Awa Mballa", phone: "690397489", email: "awa.mballa@exemple.cm", dob: "1994-03-12" },
  order: { steps: [] },
  providers: ["chez-la-petite", "cuisines-cm"],
};
