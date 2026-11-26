import type { ReactNode } from "react";
import { InfoRow } from "../web/InfoRow";
import { Modal } from "../web/Modal";
import { Panel } from "../web/Panel";
import { PublicHeader } from "../web/PublicHeader";
import { PublicShell } from "../web/PublicShell";
import { QrCard } from "../web/QrCard";
import { Tabs } from "../web/Tabs";
import { ToastProvider, useToast } from "../web/Toast";
import { Tooltip } from "../web/Tooltip";
import { IconClock, IconPhone } from "../web/icons";
import { Contained, choices, noop } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

const TABS = [{ key: "a", label: "En cours" }, { key: "b", label: "Terminées" }];

function ToastButton() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast("Commande enregistrée")} style={{ font: "inherit" }}>
      Afficher une confirmation
    </button>
  );
}

const shellPart = (label: string): ReactNode => <div style={{ padding: 24, border: "1px dashed rgba(128,128,128,.5)" }}>{label}</div>;

export const SURFACES_ENTRIES: CatalogEntrySourceInterface[] = [
  { name: "Panel", group: "surfaces", kind: "component", variants: choices(["padded", "Avec marge"], ["flush", "Sans marge"]), render: (variant) => <Panel padded={variant === "padded"}>Contenu du panneau</Panel> },
  {
    name: "Modal",
    group: "surfaces",
    kind: "component",
    wide: true,
    render: () => (
      <Contained height={260}>
        <Modal open onClose={noop} title="Annuler la commande" footer={<span>Annuler · Confirmer</span>}>
          Cette action est définitive.
        </Modal>
      </Contained>
    ),
  },
  {
    name: "Tabs",
    group: "surfaces",
    kind: "component",
    states: choices(["a", "Premier onglet"], ["b", "Second onglet"]),
    render: (_v, state) => <Tabs items={TABS} value={state} onChange={noop} />,
  },
  {
    name: "Tooltip",
    group: "surfaces",
    kind: "component",
    variants: choices(["left", "Gauche"], ["center", "Centre"], ["right", "Droite"]),
    render: (variant) => (
      <div style={{ padding: "8px 0 40px" }}>
        <Tooltip label="Délai moyen" align={variant as "left" | "center" | "right"}>
          <IconClock size={16} />
        </Tooltip>
      </div>
    ),
  },
  {
    name: "ToastProvider",
    group: "surfaces",
    kind: "component",
    render: () => (
      <Contained height={140}>
        <ToastProvider>
          <ToastButton />
        </ToastProvider>
      </Contained>
    ),
  },
  {
    name: "useToast",
    group: "surfaces",
    kind: "hook",
    render: () => (
      <Contained height={140}>
        <ToastProvider>
          <ToastButton />
        </ToastProvider>
      </Contained>
    ),
  },
  {
    name: "InfoRow",
    group: "surfaces",
    kind: "component",
    variants: choices(["plain", "Simple"], ["link", "Lien"], ["highlight", "Mis en avant"]),
    render: (variant, _s, f) => (
      <InfoRow icon={<IconPhone size={16} />} label="Téléphone" value={f.person.phone} href={variant === "link" ? `tel:+237${f.person.phone}` : undefined} highlight={variant === "highlight"} />
    ),
  },
  { name: "QrCard", group: "surfaces", kind: "component", render: () => <QrCard value="https://omnirelic.com/o/exemple" size={120} /> },
  {
    name: "PublicHeader",
    group: "surfaces",
    kind: "component",
    variants: choices(["desktop", "Bureau"], ["mobile", "Mobile"]),
    wide: true,
    render: (variant) => <PublicHeader title="Suivi de commande" isDesktop={variant === "desktop"} />,
  },
  {
    name: "PublicShell",
    group: "surfaces",
    kind: "component",
    variants: choices(["desktop", "Bureau"], ["mobile", "Mobile"]),
    wide: true,
    render: (variant) => (
      <Contained height={420}>
        <PublicShell isDesktop={variant === "desktop"} title="Suivi de commande" hero={shellPart("Hero")} main={shellPart("Contenu")} sidebar={shellPart("Colonne")} />
      </Contained>
    ),
  },
];

