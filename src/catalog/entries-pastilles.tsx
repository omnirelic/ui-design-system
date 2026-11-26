import { Badge, type BadgeVariant } from "../web/Badge";
import { Pastille } from "../web/Pastille";
import { PASTILLE_TONES, STATUS_TONE, formatCount, statusTone, toneColor, type PastilleTone } from "../web/pastille-model";
import { choices, noop } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

const TONES = PASTILLE_TONES.map((id) => ({ id, label: id }));

export const PASTILLES_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "Pastille",
    group: "pastilles",
    kind: "component",
    variants: choices(["count", "Compteur"], ["status", "Statut"], ["data", "Donnée"], ["filter", "Filtre"], ["dot", "Point"]),
    states: TONES,
    render: (variant, state) => {
      const tone = state as PastilleTone;
      if (variant === "count") return <Pastille variant="count" value={7} tone={tone} />;
      if (variant === "status") return <Pastille variant="status" label="En préparation" tone={tone} />;
      if (variant === "data") return <Pastille variant="data" segments={["2 plats", "9 000 F"]} tone={tone} />;
      if (variant === "filter") return <Pastille variant="filter" label="Douala" tone={tone} onRemove={noop} />;
      return <Pastille variant="dot" label="Nouveau" tone={tone} />;
    },
  },
  {
    name: "Badge",
    group: "pastilles",
    kind: "component",
    variants: choices(["success", "Succès"], ["warning", "Attention"], ["danger", "Erreur"], ["neutral", "Neutre"]),
    render: (variant) => <Badge variant={variant as BadgeVariant}>Livrée</Badge>,
  },
  { name: "PASTILLE_TONES", group: "pastilles", kind: "constant", examples: () => [{ call: "PASTILLE_TONES", result: PASTILLE_TONES.join(", ") }] },
  {
    name: "STATUS_TONE",
    group: "pastilles",
    kind: "constant",
    examples: () => Object.entries(STATUS_TONE).map(([status, tone]) => ({ call: `STATUS_TONE.${status}`, result: tone })),
  },
  {
    name: "formatCount",
    group: "pastilles",
    kind: "function",
    examples: () => [7, 99, 100, 0, null].map((v) => ({ call: `formatCount(${v})`, result: String(formatCount(v)) })),
  },
  {
    name: "statusTone",
    group: "pastilles",
    kind: "function",
    examples: () => ["delivered", "pending_payment", "cancelled", "inconnu"].map((s) => ({ call: `statusTone('${s}')`, result: statusTone(s) })),
  },
  {
    name: "toneColor",
    group: "pastilles",
    kind: "function",
    examples: () => PASTILLE_TONES.map((t) => ({ call: `toneColor('${t}')`, result: toneColor(t) })),
  },
];
