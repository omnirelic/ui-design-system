// Entrées du lot « masquage, recherche et visibilité » (portées de Chez la Petite) : numéro masqué, pastille de numéro, adresse, recherche stricte, montants.
// Tous les numéros sont fabriqués : aucun numéro réel.
import { AddressQuoteProvider, AddressRef, OUT_OF_ZONE, formatKm, neighborhoodFromAddressLabel, orderPlaceRowLabel, orderPlaceText, quoteTarget } from "../web/entry-entity";
import { CLP_MTN_PREFIXES, CLP_ORANGE_PREFIXES, CountryFlag, DESK_COUNTRIES, DESK_DEFAULT_COUNTRY, DESK_DIAL_CODES, FLAG_DIALS, FloatingTooltip, MaskedPhone, PHONE_SEARCH_MIN_DIGITS, PhoneRef, Z_TOOLTIP, adminRoles, buildDeskPhone, canRevealPhone, conversationPhoneKey, detectAdminMobileOperator, formatPhoneGrouped, hasAnyRole, isMaskedPhoneText, isShortPhoneTerm, isValidDeskPhone, maskPhoneText, maskedPhoneParts, parseDeskPhone, phoneActions, phoneRank, phoneSearchTermDigits, searchDeskCountries } from "../web/entry-masked-phone";
import { AMOUNTS_STORAGE_KEY, maskAmounts, ordersAmountsAccess } from "../web/entry-amounts";
import { SEARCH_PAGE_SIZE, filterByWords, foldAccents, mergeSearchResults, needsServerSearch, normalizeSearch, searchKeywordIndex, searchWords } from "../web/entry-search";
import { choices } from "./live";
import type { CatalogEntrySourceInterface, CatalogExampleInterface } from "./types";

const ex = (call: string, result: unknown): CatalogExampleInterface => ({ call, result: typeof result === "string" ? result : JSON.stringify(result) });
const each = (name: string, f: (x: string) => unknown, inputs: string[]): CatalogExampleInterface[] => inputs.map((x) => ex(`${name}(${JSON.stringify(x)})`, f(x)));

const PHONES = [["+237690000011", "Orange (Cameroun)"], ["+237677000019", "MTN (Cameroun)"], ["+33600000078", "France"], ["+14155550123", "Indicatif partagé"], ["+237•••••••11", "Ancien format"]] as const;
const INDEX = [{ label: "Prix", keywords: "tarif montant coût" }, { label: "Photo principale", keywords: "image visuel" }, { label: "Stock", keywords: "quantité inventaire" }];
const LINES = [{ id: "a", lastMessageAt: "2026-11-01T10:00:00Z" }, { id: "b", lastMessageAt: "2026-11-03T10:00:00Z" }, { id: "c", lastMessageAt: "2026-11-02T10:00:00Z" }];

const quote = (kind: string) => () => ({ quote: kind === "out" ? { fee: 1000, distanceKm: 16.2, etaMin: 40, outOfRange: true } : kind === "none" ? null : { fee: 1000, distanceKm: 3.4, etaMin: 17, outOfRange: false }, loading: kind === "loading" });

export const NUMERO_MONTANTS_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "MaskedPhone", group: "numero", kind: "component",
    variants: choices(...PHONES.map(([p, l]) => [p, l] as [string, string])),
    states: choices(["flag", "Drapeau"], ["text", "Indicatif écrit"]),
    render: (variant, state) => <MaskedPhone phone={variant} flag={state === "flag"} />,
  },
  {
    name: "PhoneRef", group: "numero", kind: "component",
    states: choices(["open", "Ouvre le fil"], ["text", "Texte seul"]),
    render: (_v, state) => <PhoneRef phone="+237691000019" onOpen={state === "open" ? () => undefined : undefined} />,
  },
  { name: "CountryFlag", group: "numero", kind: "component", variants: choices(["+237", "Cameroun"], ["+33", "France"], ["+225", "Côte d'Ivoire"], ["+1", "Indicatif partagé : globe"]), render: (variant) => <CountryFlag dial={variant} height={20} /> },
  {
    name: "AddressRef", group: "numero", kind: "component",
    states: choices(["quote", "Avec devis"], ["loading", "Calcul"], ["out", "Hors zone"], ["none", "Sans devis"]),
    render: (_v, state) => <AddressQuoteProvider useRoadQuote={quote(state)}><AddressRef address={{ neighborhoodId: "bona", label: "Bonamoussadi" }} /></AddressQuoteProvider>,
  },
  { name: "FloatingTooltip", group: "numero", kind: "component", render: () => <FloatingTooltip content="Exemple d'infobulle" placement="bottom"><button type="button">Survoler</button></FloatingTooltip> },
  { name: "Z_TOOLTIP", group: "numero", kind: "constant", examples: () => [ex("Z_TOOLTIP", Z_TOOLTIP)] },
  { name: "FLAG_DIALS", group: "numero", kind: "constant", examples: () => [ex("FLAG_DIALS", FLAG_DIALS)] },
  { name: "OUT_OF_ZONE", group: "numero", kind: "constant", examples: () => [ex("OUT_OF_ZONE", OUT_OF_ZONE)] },
  { name: "maskPhoneText", group: "numero", kind: "function", examples: () => each("maskPhoneText", maskPhoneText, ["690000011", "+33600000078", "+237•••••••11", ""]) },
  { name: "maskedPhoneParts", group: "numero", kind: "function", examples: () => each("maskedPhoneParts", maskedPhoneParts as never, ["+237690000011", "+33600000078", "+237•••••••11"]) },
  { name: "isMaskedPhoneText", group: "numero", kind: "function", examples: () => each("isMaskedPhoneText", isMaskedPhoneText, ["+237 ORANGE 11", "Éloïse", "••• •• •• 35"]) },
  { name: "detectAdminMobileOperator", group: "numero", kind: "function", examples: () => each("detectAdminMobileOperator", detectAdminMobileOperator, ["690000011", "677000019", "620000011", "684000011"]) },
  { name: "CLP_ORANGE_PREFIXES", group: "numero", kind: "constant", examples: () => [ex("[...CLP_ORANGE_PREFIXES].join(' ')", [...CLP_ORANGE_PREFIXES].join(" "))] },
  { name: "CLP_MTN_PREFIXES", group: "numero", kind: "constant", examples: () => [ex("[...CLP_MTN_PREFIXES].join(' ')", [...CLP_MTN_PREFIXES].join(" "))] },
  { name: "formatPhoneGrouped", group: "numero", kind: "function", examples: () => each("formatPhoneGrouped", formatPhoneGrouped, ["+237690000011", "690000011", "+33600000078"]) },
  { name: "conversationPhoneKey", group: "numero", kind: "function", examples: () => each("conversationPhoneKey", (x) => conversationPhoneKey(x), ["690000011", "+33600000078", "+237 6•• •• 12 34", "12"]) },
  { name: "DESK_COUNTRIES", group: "numero", kind: "constant", examples: () => [ex("DESK_COUNTRIES.length", DESK_COUNTRIES.length), ex("DESK_COUNTRIES[1]", DESK_COUNTRIES[1])] },
  { name: "DESK_DEFAULT_COUNTRY", group: "numero", kind: "constant", examples: () => [ex("DESK_DEFAULT_COUNTRY", DESK_DEFAULT_COUNTRY)] },
  { name: "DESK_DIAL_CODES", group: "numero", kind: "constant", examples: () => [ex("DESK_DIAL_CODES.slice(0, 6)", DESK_DIAL_CODES.slice(0, 6))] },
  { name: "searchDeskCountries", group: "numero", kind: "function", examples: () => each("searchDeskCountries", (q) => searchDeskCountries(q, 3).map((c) => c.iso), ["fr", "cote", "+2"]) },
  { name: "parseDeskPhone", group: "numero", kind: "function", examples: () => each("parseDeskPhone", (x) => parseDeskPhone(x), ["+33600000078", "690000011"]) },
  { name: "buildDeskPhone", group: "numero", kind: "function", examples: () => [ex("buildDeskPhone(Cameroun, '0690000011')", buildDeskPhone(DESK_COUNTRIES[0]!, "0690000011")), ex("buildDeskPhone(France, '600000078')", buildDeskPhone(DESK_COUNTRIES[1]!, "600000078"))] },
  { name: "isValidDeskPhone", group: "numero", kind: "function", examples: () => [ex("isValidDeskPhone(Cameroun, '690000011')", isValidDeskPhone(DESK_COUNTRIES[0]!, "690000011")), ex("isValidDeskPhone(Cameroun, '69000')", isValidDeskPhone(DESK_COUNTRIES[0]!, "69000"))] },
  { name: "phoneRank", group: "numero", kind: "function", examples: () => [ex("phoneRank({ roles: ['support', 'superadmin'] })", phoneRank({ roles: ["support", "superadmin"] })), ex("phoneRank({ role: 'ops' })", phoneRank({ role: "ops" }))] },
  { name: "canRevealPhone", group: "numero", kind: "function", examples: () => (["superadmin", "admin", "other"] as const).map((r) => ex(`canRevealPhone('${r}', 'view') / 'call'`, [canRevealPhone(r, "view"), canRevealPhone(r, "call")])) },
  { name: "adminRoles", group: "numero", kind: "function", examples: () => [ex("adminRoles({ role: 'ops', roles: ['ops', 'support'] })", adminRoles({ role: "ops", roles: ["ops", "support"] })), ex("adminRoles({ role: 'ops' })", adminRoles({ role: "ops" }))] },
  { name: "hasAnyRole", group: "numero", kind: "function", examples: () => [ex("hasAnyRole(['ops'], 'admin', 'ops')", hasAnyRole(["ops"], "admin", "ops")), ex("hasAnyRole('support', 'admin')", hasAnyRole("support", "admin"))] },
  { name: "phoneActions", group: "numero", kind: "function", examples: () => (["superadmin", "admin"] as const).map((r) => ex(`phoneActions('${r}').map(id)`, phoneActions(r).map((a) => a.id))) },
  { name: "PHONE_SEARCH_MIN_DIGITS", group: "recherche", kind: "constant", examples: () => [ex("PHONE_SEARCH_MIN_DIGITS", PHONE_SEARCH_MIN_DIGITS)] },
  { name: "phoneSearchTermDigits", group: "recherche", kind: "function", examples: () => each("phoneSearchTermDigits", phoneSearchTermDigits, ["+237 690 000 011", "00237690000011", "69000", "Awa 690000"]) },
  { name: "isShortPhoneTerm", group: "recherche", kind: "function", examples: () => each("isShortPhoneTerm", isShortPhoneTerm, ["69000", "690000", "Awa"]) },
  { name: "normalizeSearch", group: "recherche", kind: "function", examples: () => each("normalizeSearch", normalizeSearch, ["Éloïse", "+237 ••• 19", "ça va ?", "straße"]) },
  { name: "foldAccents", group: "recherche", kind: "function", examples: () => each("foldAccents", foldAccents, ["Seuil « bientôt épuisé »", "ÉLOÏSE"]) },
  { name: "searchWords", group: "recherche", kind: "function", examples: () => each("searchWords", searchWords, ["Poulet  DG", "  !! "]) },
  { name: "filterByWords", group: "recherche", kind: "function", examples: () => [ex("filterByWords(['Éloïse M.', 'Awa', 'Paul'], 'eloise', (n) => [n])", filterByWords(["Éloïse M.", "Awa", "Paul"], "eloise", (n) => [n])), ex("filterByWords(['Poulet DG', 'Ndolé'], 'dg poulet', (n) => [n])", filterByWords(["Poulet DG", "Ndolé"], "dg poulet", (n) => [n]))] },
  { name: "searchKeywordIndex", group: "recherche", kind: "function", examples: () => ["coût", "photo visuel", "zzz"].map((q) => ex(`searchKeywordIndex(${JSON.stringify(q)}, index).map(label)`, searchKeywordIndex(q, INDEX).map((e) => e.label))) },
  { name: "mergeSearchResults", group: "recherche", kind: "function", examples: () => [ex("mergeSearchResults([a], [a, b, c]).map(id) (serveur du plus récent au plus ancien)", mergeSearchResults([LINES[0]!], LINES).map((l) => l.id))] },
  { name: "SEARCH_PAGE_SIZE", group: "recherche", kind: "constant", examples: () => [ex("SEARCH_PAGE_SIZE", SEARCH_PAGE_SIZE)] },
  { name: "needsServerSearch", group: "recherche", kind: "function", examples: () => [ex("needsServerSearch([3 lignes], 'poulet')", needsServerSearch([1, 2, 3], "poulet")), ex("needsServerSearch([3 lignes], '690 00')", needsServerSearch([1, 2, 3], "690 00")), ex("needsServerSearch([50 lignes], 'poulet')", needsServerSearch(Array.from({ length: 50 }), "poulet"))] },
  { name: "ordersAmountsAccess", group: "montants", kind: "function", examples: () => [ex("ordersAmountsAccess(['admin'], 'archived', false)", ordersAmountsAccess(["admin"], "archived", false)), ex("ordersAmountsAccess(['ops'], 'active', true)", ordersAmountsAccess(["ops"], "active", true)), ex("ordersAmountsAccess(['ops'], 'archived', true)", ordersAmountsAccess(["ops"], "archived", true))] },
  { name: "maskAmounts", group: "montants", kind: "function", examples: () => each("maskAmounts", maskAmounts, ["Paiement ORANGE initié · 4 000 XAF", "Annulée (1 850 XAF)", "Commande #0456"]) },
  { name: "AMOUNTS_STORAGE_KEY", group: "montants", kind: "constant", examples: () => [ex("AMOUNTS_STORAGE_KEY", AMOUNTS_STORAGE_KEY)] },
  { name: "formatKm", group: "numero", kind: "function", examples: () => [3.4, 16, 0.04].map((km) => ex(`formatKm(${km})`, formatKm(km))) },
  { name: "quoteTarget", group: "numero", kind: "function", examples: () => [{ lat: 4.05, lng: 9.7 }, { neighborhoodId: "akwa" }, { instructions: "Devant la pharmacie" }].map((a) => ex(`quoteTarget(${JSON.stringify(a)})`, quoteTarget(a))) },
  { name: "orderPlaceText", group: "numero", kind: "function", examples: () => [["Ma localisation: Akwa", "Akwa"], ["Rue Njo-Njo", "Bonapriso"], [null, "Akwa"]].map(([a, q]) => ex(`orderPlaceText(${JSON.stringify(a)}, ${JSON.stringify(q)})`, orderPlaceText(a, q))) },
  { name: "orderPlaceRowLabel", group: "numero", kind: "function", examples: () => ["Ma localisation: Akwa", "Rue Njo-Njo"].map((a) => ex(`orderPlaceRowLabel(${JSON.stringify(a)})`, orderPlaceRowLabel(a))) },
  { name: "neighborhoodFromAddressLabel", group: "numero", kind: "function", examples: () => ["Ma localisation: Akwa", "Rue Njo-Njo", ""].map((a) => ex(`neighborhoodFromAddressLabel(${JSON.stringify(a)})`, neighborhoodFromAddressLabel(a))) },
];
