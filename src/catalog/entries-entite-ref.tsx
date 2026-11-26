import { MemoryRouter } from "react-router-dom";
import { createEntityGraph } from "../web/entry-entity-graph";
import {
  DEFAULT_LEAD_ICON, EntityAvatar, EntityRef, EntityRefProvider, LeadDisc, MAX_SEGMENTS, PERSON_LEAD_ICON, PastilleBox, PastilleCapsule, QualifierSegment, ROLE_ORDER, Segments, StockBadge,
  VariationChip, Z_CARD, arrangeSegments, contrastRatio, defaultFormatMoney, entityChipModel, formatPersonName, formatPersonNameOrNull, initialsOf, initialsVariant, leadFor,
  legibleColor, tintedDiscBackground,
} from "../web/entry-entity";
import type { PastilleLead } from "../web/entry-entity";
import { choices } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

// Graphe d'exemple : un livreur (personne), un véhicule, un plat. Routeur en mémoire : aucun lien ne quitte la carte.
const graph = createEntityGraph({
  defs: {
    courier: { label: "Livreur", view: "couriers", param: "courier", idIs: "id du livreur", person: true },
    vehicle: { label: "Véhicule", view: "vehicles", param: "vehicle", idIs: "id du véhicule", icon: "res-vehicles" },
    item: { label: "Plat", view: "menu", param: "item", idIs: "id du plat", icon: "res-dish" },
  },
  relations: [{ a: "courier", b: "vehicle", ab: "Véhicule", ba: "Livreur", via: "véhicule assigné" }, { a: "item", b: "vehicle", ab: "Véhicule", ba: "Plat", via: "exemple" }],
  viewPath: (view: string) => `/admin/${view}`,
});
const defs = graph.defs;

function Demo({ children }: { children: React.ReactNode }) {
  return <MemoryRouter><EntityRefProvider value={{ graph }}>{children}</EntityRefProvider></MemoryRouter>;
}
const order = arrangeSegments([{ role: "label", text: "#0765", strong: true }, { role: "state", text: "En attente", tone: "warn" }, { role: "value", money: 19000 }, { role: "when", text: "14:12" }]);
const orderLead: PastilleLead = { kind: "icon", icon: "res-orders" };

export const ENTITE_REF_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "EntityRef",
    group: "entites",
    kind: "component",
    variants: choices(["chip", "Pastille"], ["compact", "Compacte"], ["point", "Point"], ["num", "Numéro"], ["row", "Ligne"], ["card", "Carte"], ["detail", "En-tête"]),
    states: choices(["courier", "Livreur"], ["vehicle", "Véhicule"], ["item", "Plat (quantité, variation, stock)"]),
    render: (variant, state) => (
      <Demo>
        {state === "item"
          ? <EntityRef kind="item" id="j" label="Jus de Foléré" qty={2} variation="M" stock={{ level: "low", count: 2 }} variant={variant as "chip"} noMenu />
          : <EntityRef kind={state} id="x1" label={state === "courier" ? "MARC KAMGA" : "Moto"} sub={state === "courier" ? "Moto · LT-123-AB" : "2/4 commandes"} dot="var(--o-success, #34D399)" badge={{ label: "En service", color: "green" }} variant={variant as "chip"} noMenu />}
      </Demo>
    ),
  },
  {
    name: "PastilleCapsule",
    group: "entites",
    kind: "component",
    variants: choices(["pill", "Pastille"], ["compact", "Compacte"], ["point", "Point"]),
    states: choices(["plain", "Simple"], ["gold", "Accent"], ["qualifier", "Badge"]),
    render: (variant, state) => (
      <PastilleBox>
        <PastilleCapsule form={variant as "pill"} lead={<LeadDisc lead={orderLead} size={variant === "point" ? "md" : "sm"} />} segments={order} stateDot="var(--o-warning, #FF9F43)" gold={state === "gold"} qualifier={state === "qualifier" ? { label: "Nouveau", icon: "ui-sparkle", tone: "green" } : undefined} />
      </PastilleBox>
    ),
  },
  { name: "PastilleBox", group: "entites", kind: "component", render: () => <div style={{ width: 260, border: "1px dashed currentColor", padding: 6 }}><PastilleBox><PastilleCapsule lead={<LeadDisc lead={orderLead} />} segments={order} /></PastilleBox></div> },
  { name: "LeadDisc", group: "entites", kind: "component", variants: choices(["sm", "22 px"], ["md", "28 px"], ["lg", "40 px"]), states: choices(["icon", "Icône"], ["tint", "Couleur réelle"], ["photo", "Personne"]), render: (variant, state) => <LeadDisc size={variant as "sm"} name="Nathalie Diane" lead={state === "photo" ? { kind: "photo", icon: PERSON_LEAD_ICON } : state === "tint" ? { kind: "icon", icon: "res-bags", tint: "#1b2a49" } : { kind: "icon", icon: "res-orders" }} /> },
  { name: "Segments", group: "entites", kind: "component", render: () => <span style={{ display: "inline-flex", gap: 8 }}><Segments segments={order} /></span> },
  { name: "QualifierSegment", group: "entites", kind: "component", states: choices(["green", "Vert"], ["gold", "Accent"], ["orange", "Orange"], ["red", "Rouge"], ["violet", "Violet"]), render: (_v, state) => <span className="omni-pst" style={{ display: "inline-flex" }}><QualifierSegment qualifier={{ label: "Fidèle", icon: "ui-seal-check", tone: state as "gold" }} /></span> },
  { name: "VariationChip", group: "entites", kind: "component", render: () => <VariationChip label="M (0,5 l)" /> },
  { name: "StockBadge", group: "entites", kind: "component", states: choices(["ok", "Stocké"], ["low", "Bas"], ["out", "Épuisé"], ["made_to_order", "À la commande"]), render: (_v, state) => <StockBadge stock={state === "made_to_order" ? { level: "made_to_order" } : { level: state as "ok", count: state === "out" ? 0 : 7 }} /> },
  { name: "EntityAvatar", group: "entites", kind: "component", states: choices(["initials", "Initiales"], ["none", "Silhouette"]), render: (_v, state) => <EntityAvatar name={state === "none" ? "" : "Joel Kamga"} size={40} /> },
  {
    name: "arrangeSegments",
    group: "entites",
    kind: "function",
    examples: () => [
      { call: "arrangeSegments([when, value(19000), label, state]).map(s => s.role)", result: arrangeSegments([{ role: "when", text: "hier" }, { role: "value", money: 19000 }, { role: "label", text: "#0765" }, { role: "state", text: "En attente" }]).map((s) => s.role).join(" | ") },
      { call: "arrangeSegments([label, state '  ', value null]).length", result: String(arrangeSegments([{ role: "label", text: "#0765" }, { role: "state", text: "  " }, { role: "value", money: null }]).length) },
    ],
  },
  {
    name: "leadFor",
    group: "entites",
    kind: "function",
    examples: () => [
      { call: "leadFor(courier)", result: JSON.stringify(leadFor(defs.courier)) },
      { call: "leadFor(vehicle, { color: '#2BB673' })", result: JSON.stringify(leadFor(defs.vehicle, { color: "#2BB673" })) },
      { call: "leadFor({})", result: JSON.stringify(leadFor({})) },
    ],
  },
  {
    name: "entityChipModel",
    group: "entites",
    kind: "function",
    examples: () => [{ call: "entityChipModel({ def: vehicle, label: 'Moto', sub: 'Bas', dot: 'orange' }).segments", result: entityChipModel({ def: defs.vehicle, label: "Moto", sub: "Bas", dot: "orange" }).segments.map((s) => `${s.pos}:${s.role}:${s.text}`).join(", ") }],
  },
  { name: "formatPersonName", group: "entites", kind: "function", examples: () => ["BILL SOMEN", "jean-paul N'GUESSAN", "McDonald"].map((n) => ({ call: `formatPersonName('${n}')`, result: formatPersonName(n) })) },
  { name: "formatPersonNameOrNull", group: "entites", kind: "function", examples: () => [{ call: "formatPersonNameOrNull('  ')", result: String(formatPersonNameOrNull("  ")) }] },
  { name: "initialsOf", group: "entites", kind: "function", examples: () => ["Joel Kamga", "Anonyme", "Marc"].map((n) => ({ call: `initialsOf('${n}')`, result: JSON.stringify(initialsOf(n)) })) },
  { name: "initialsVariant", group: "entites", kind: "function", examples: () => [40, 56].map((s) => ({ call: `initialsVariant(${s})`, result: initialsVariant(s) })) },
  { name: "contrastRatio", group: "entites", kind: "function", examples: () => [{ call: "contrastRatio('#ffffff', '#1f1f1f')", result: contrastRatio("#ffffff", "#1f1f1f").toFixed(2) }] },
  { name: "legibleColor", group: "entites", kind: "function", examples: () => [{ call: "legibleColor('#1b2a49', '#1f1f1f')", result: legibleColor("#1b2a49", "#1f1f1f") }, { call: "legibleColor('#f5c518', '#1f1f1f')", result: legibleColor("#f5c518", "#1f1f1f") }] },
  { name: "tintedDiscBackground", group: "entites", kind: "function", examples: () => [{ call: "tintedDiscBackground('#2BB673')", result: tintedDiscBackground("#2BB673") }] },
  { name: "defaultFormatMoney", group: "entites", kind: "function", examples: () => [{ call: "defaultFormatMoney(19000, false)", result: defaultFormatMoney(19000, false).replace(/ /g, " ") }, { call: "defaultFormatMoney(500, true)", result: defaultFormatMoney(500, true).replace(/ /g, " ") }] },
  { name: "ROLE_ORDER", group: "entites", kind: "constant", examples: () => [{ call: "ROLE_ORDER", result: ROLE_ORDER.join(" | ") }] },
  { name: "MAX_SEGMENTS", group: "entites", kind: "constant", examples: () => [{ call: "MAX_SEGMENTS", result: String(MAX_SEGMENTS) }] },
  { name: "Z_CARD", group: "entites", kind: "constant", examples: () => [{ call: "Z_CARD", result: String(Z_CARD) }] },
  { name: "DEFAULT_LEAD_ICON", group: "entites", kind: "constant", examples: () => [{ call: "DEFAULT_LEAD_ICON", result: DEFAULT_LEAD_ICON }] },
  { name: "PERSON_LEAD_ICON", group: "entites", kind: "constant", examples: () => [{ call: "PERSON_LEAD_ICON", result: PERSON_LEAD_ICON }] },
];
