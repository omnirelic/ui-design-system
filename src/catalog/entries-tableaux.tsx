// Lot 3 du désossage de CLP : tableau unique, pagination, état vide, menu déroulant.
import { DataTable, type DataTableColumn } from "../web/DataTable";
import { EmptyState } from "../web/EmptyState";
import { Pager } from "../web/Pager";
import { Select } from "../web/Select";
import { PAGE_SIZES, usePagination } from "../web/usePagination";
import { Controlled, choices, noop } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

type Row = { id: string; name: string; zone: string; qty: number };
const ROWS: Row[] = Array.from({ length: 34 }, (_, i) => ({ id: String(i), name: `Livreur ${i + 1}`, zone: ["Kotto", "Akwa", "Bonamoussadi"][i % 3], qty: (i * 7) % 12 }));
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Nom", render: (r) => r.name, primary: true, width: "2fr" },
  { key: "zone", header: "Zone", render: (r) => r.zone },
  { key: "qty", header: "Courses", render: (r) => r.qty, align: "right", width: "90px" },
];
const SELECT_OPTIONS = [
  { value: "", label: "Tous les livreurs" },
  { value: "1", label: "Marie-Paule" },
  { value: "2", label: "François" },
  { value: "3", label: "Bâton", disabled: true },
];

function PagerDemo() {
  const p = usePagination(ROWS, { pageSize: 10 });
  return <Pager pagination={p} />;
}

export const TABLEAUX_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "DataTable",
    group: "tableaux",
    kind: "component",
    wide: true,
    variants: choices(["plain", "Simple"], ["clickable", "Ligne cliquable"], ["selected", "Ligne choisie"], ["paged", "Paginé"], ["empty", "Vide"]),
    render: (variant) => (
      <DataTable
        columns={COLUMNS}
        rows={variant === "empty" ? [] : ROWS.slice(0, variant === "paged" ? 34 : 4)}
        rowKey={(r) => r.id}
        onRowClick={variant === "clickable" || variant === "selected" ? noop : undefined}
        selectedKey={variant === "selected" ? "1" : null}
        pageSize={variant === "paged" ? 10 : undefined}
        emptyTitle="Aucun livreur"
      />
    ),
  },
  { name: "Pager", group: "tableaux", kind: "component", wide: true, render: () => <PagerDemo /> },
  {
    name: "EmptyState",
    group: "tableaux",
    kind: "component",
    variants: choices(["title", "Titre seul"], ["hint", "Avec indication"]),
    render: (variant) => <EmptyState title="Aucun résultat" hint={variant === "hint" ? "Modifiez le filtre" : undefined} />,
  },
  { name: "usePagination", group: "tableaux", kind: "hook", render: () => <PagerDemo /> },
  {
    name: "PAGE_SIZES",
    group: "tableaux",
    kind: "constant",
    examples: () => [{ call: "PAGE_SIZES", result: JSON.stringify([...PAGE_SIZES]) }],
  },
  {
    name: "Select",
    group: "champs",
    kind: "component",
    variants: choices(["plain", "Simple"], ["searchable", "Avec recherche"], ["icon", "Icône seule"], ["small", "Petit"]),
    states: choices(["empty", "Vide"], ["selected", "Choisi"], ["disabled", "Désactivé"]),
    render: (variant, state) => (
      <div style={{ width: 260 }}>
        <Controlled<string> initial={state === "selected" ? "1" : ""}>
          {(value, set) => (
            <Select
              options={SELECT_OPTIONS}
              value={value}
              onChange={set}
              ariaLabel="Livreur"
              searchable={variant === "searchable"}
              icon={variant === "icon" ? "ui-chevron-down" : undefined}
              uiSize={variant === "small" ? "sm" : "md"}
              disabled={state === "disabled"}
            />
          )}
        </Controlled>
      </div>
    ),
  },
];
