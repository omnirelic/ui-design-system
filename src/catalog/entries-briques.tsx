// Briques de base reprises de Chez la Petite (lot 2) : retours, tiroir, confirmation, copie, pagination, icônes.
import { Alert } from "../web/Alert";
import { ConfirmDialog } from "../web/ConfirmDialog";
import { CopyButton, CopyTextButton } from "../web/CopyButton";
import { Drawer } from "../web/Drawer";
import { Icon } from "../web/Icon";
import { ICONS } from "../web/icon-registry";
import { Pagination } from "../web/Pagination";
import { Sk, SkBar, SkGrid, SkRows, SkTable } from "../web/Skeleton";
import { Spinner } from "../web/Spinner";
import { useCopied, writeClipboard } from "../web/useCopied";
import { Contained, Controlled, choices, noop } from "./live";
import type { IconName } from "../web/Icon";
import type { CatalogEntrySourceInterface } from "./types";

function CopiedDemo() {
  const { copied, copy } = useCopied();
  return <button type="button" onClick={() => void copy("texte")} style={{ font: "inherit" }}>{copied ? "Copié" : "Copier « texte »"}</button>;
}

export const BRIQUES_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "Alert",
    group: "retours",
    kind: "component",
    variants: choices(["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"], ["info", "Information"]),
    states: choices(["plain", "Sans croix"], ["closable", "Avec croix"]),
    render: (variant, state) => <Alert type={variant as "success" | "warning" | "error" | "info"} message="Commande enregistrée" onClose={state === "closable" ? noop : undefined} />,
  },
  {
    name: "Spinner",
    group: "retours",
    kind: "component",
    variants: choices(["24", "24 px"], ["12", "12 px"], ["40", "40 px"]),
    render: (variant) => <Spinner size={Number(variant)} />,
  },
  { name: "Sk", group: "retours", kind: "component", render: () => <Sk w={160} h={14} /> },
  { name: "SkRows", group: "retours", kind: "component", render: () => <SkRows n={4} /> },
  { name: "SkTable", group: "retours", kind: "component", wide: true, render: () => <SkTable rows={3} cols={4} /> },
  { name: "SkGrid", group: "retours", kind: "component", wide: true, render: () => <SkGrid cards={3} cardH={80} /> },
  { name: "SkBar", group: "retours", kind: "component", render: () => <SkBar /> },
  {
    name: "Drawer",
    group: "surfaces",
    kind: "component",
    wide: true,
    variants: choices(["standard", "Standard"], ["bare", "Sans titre"]),
    render: (variant) => (
      <Contained height={320}>
        <Drawer open onClose={noop} title="Fiche livreur" width={420} bare={variant === "bare"} footer={<span>Enregistrer</span>}>
          Contenu du tiroir
        </Drawer>
      </Contained>
    ),
  },
  {
    name: "ConfirmDialog",
    group: "surfaces",
    kind: "component",
    wide: true,
    variants: choices(["primary", "Principal"], ["danger", "Danger"]),
    states: choices(["idle", "Repos"], ["loading", "Chargement"]),
    render: (variant, state) => (
      <Contained height={260}>
        <ConfirmDialog open title="Annuler la commande" message="Cette action est définitive." confirmLabel="Annuler la commande" danger={variant === "danger"} loading={state === "loading"} onConfirm={noop} onCancel={noop} />
      </Contained>
    ),
  },
  {
    name: "CopyButton",
    group: "boutons",
    kind: "component",
    variants: choices(["icon", "Icône seule"], ["label", "Avec libellé"], ["wide", "Pleine largeur"]),
    states: choices(["idle", "Repos"], ["disabled", "Désactivé"]),
    render: (variant, state) => (
      <div style={{ width: variant === "wide" ? 220 : undefined }}>
        <CopyButton text="CMD-0736" tooltip="Copier le numéro" label={variant === "icon" ? undefined : "Copier"} wide={variant === "wide"} disabled={state === "disabled"} />
      </div>
    ),
  },
  { name: "CopyTextButton", group: "boutons", kind: "component", render: () => <CopyTextButton label="Copier le message" getText={() => "Bonjour"} /> },
  {
    name: "Pagination",
    group: "boutons",
    kind: "component",
    states: choices(["first", "Première page"], ["middle", "Au milieu"], ["last", "Dernière page"]),
    render: (_v, state) => <Controlled initial={state === "first" ? 1 : state === "middle" ? 5 : 9}>{(page, set) => <Pagination page={page} totalPages={9} onChange={set} />}</Controlled>,
  },
  {
    name: "Icon",
    group: "icones",
    kind: "component",
    wide: true,
    variants: choices(["action-close", "action-close"], ["res-orders", "res-orders"], ["status-success", "status-success"], ["status-error", "status-error"], ["service-delivery", "service-delivery"]),
    render: (variant) => (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Icon name={variant as IconName} size={16} /><Icon name={variant as IconName} /><Icon name={variant as IconName} size={32} weight="bold" />
      </div>
    ),
  },
  {
    name: "ICONS",
    group: "icones",
    kind: "constant",
    examples: () => [
      { call: "Object.keys(ICONS).length", result: String(Object.keys(ICONS).length) },
      { call: "Object.keys(ICONS).filter((n) => n.startsWith('action-')).length", result: String(Object.keys(ICONS).filter((n) => n.startsWith("action-")).length) },
    ],
  },
  { name: "useCopied", group: "boutons", kind: "hook", render: () => <CopiedDemo /> },
  { name: "writeClipboard", group: "boutons", kind: "function", render: () => <button type="button" onClick={() => void writeClipboard("texte")} style={{ font: "inherit" }}>Écrire dans le presse-papiers</button> },
];
