import { Button } from "../web/Button";
import { Reactive } from "../web/Reactive";
import { IconX } from "../web/icons";
import { choices, noop } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

export const BOUTONS_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "Button",
    group: "boutons",
    kind: "component",
    variants: choices(["primary", "Principal"], ["ghost", "Contour"], ["danger", "Danger"], ["icon", "Icône"]),
    states: choices(["idle", "Repos"], ["disabled", "Désactivé"], ["loading", "Chargement"]),
    render: (variant, state) => (
      <Button variant={variant as "primary" | "ghost" | "danger" | "icon"} disabled={state === "disabled"} loading={state === "loading"} onClick={noop}>
        {variant === "icon" ? <IconX size={16} /> : "Valider"}
      </Button>
    ),
  },
  {
    name: "Reactive",
    group: "boutons",
    kind: "component",
    variants: choices(["primary", "Principal"], ["ghost", "Contour"], ["icon", "Icône"], ["chip", "Puce"], ["card", "Carte"]),
    render: (variant) => (
      <Reactive variant={variant as "primary" | "ghost" | "icon" | "chip" | "card"} onClick={noop} style={{ padding: "10px 16px", background: "transparent", border: "1px solid currentColor", color: "inherit", borderRadius: 8, cursor: "pointer" }}>
        Survolez-moi
      </Reactive>
    ),
  },
];
