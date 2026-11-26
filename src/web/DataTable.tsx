// Tableau unique (CLP web/src/admin/ui/DataTable.tsx), repris tel quel : grille sur grand écran (une carte arrondie par ligne,
// colonnes partagées par sous-grille), une carte empilée par ligne sur téléphone, pagination intégrée, ligne dépliable.
// Ce que CLP n'a pas, ce tableau ne l'invente pas : ni tri, ni sélection par cases, ni en-tête collant, ni filtres de colonne.
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ACCENT, BORDER, CARD } from "./theme";
import { tint } from "./controls";
import { clpText } from "./clp-text";
import { EmptyState } from "./EmptyState";
import { Pager } from "./Pager";
import { usePagination } from "./usePagination";
import "./data-table-css";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Largeur de la colonne (grille CSS) ; défaut `1fr`. */
  width?: string;
  align?: "left" | "right" | "center";
  /** Cellule qui sert de titre à la carte mobile (sans libellé). */
  primary?: boolean;
  /** Masquée sur téléphone. */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
  /** Pagination intégrée (taille par défaut) ; omis = tout afficher. */
  pageSize?: number;
  /** Change (filtre, recherche…) : retour page 1. */
  resetKey?: unknown;
  /** Panneau déplié sous la ligne (null = replié). */
  renderExpanded?: (row: T) => ReactNode;
  /** Ligne mise en avant (sélection multiple, ligne dépliée…). */
  isHighlighted?: (row: T) => boolean;
}

// Plancher d'une colonne flexible (fr) et d'une colonne `auto` : en dessous, le tableau défile
// horizontalement au lieu d'écraser les cellules (nom client coupé lettre par lettre).
const FLEX_FLOOR_PX = 112;
const AUTO_FLOOR_PX = 160;

function columnFloor(width: string | undefined): { track: string; px: number } {
  if (!width || width === "auto") return { track: width ?? `minmax(${FLEX_FLOOR_PX}px, 1fr)`, px: width ? AUTO_FLOOR_PX : FLEX_FLOOR_PX };
  const fr = width.match(/^(?:minmax\(0,\s*)?([\d.]+)fr\)?$/);
  if (fr) return { track: `minmax(${FLEX_FLOOR_PX}px, ${fr[1]}fr)`, px: FLEX_FLOOR_PX };
  const px = width.match(/^([\d.]+)px$/);
  return { track: width, px: px ? Number(px[1]) : FLEX_FLOOR_PX };
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, selectedKey, emptyTitle = "Aucun résultat", emptyHint, pageSize, resetKey, renderExpanded, isHighlighted }: DataTableProps<T>) {
  const pagination = usePagination(rows, { pageSize: pageSize ?? Math.max(rows.length, 1), resetKey });
  const visible = pageSize ? pagination.pageItems : rows;
  if (rows.length === 0) return <EmptyState title={emptyTitle} hint={emptyHint} />;
  const floors = columns.map(c => columnFloor(c.width));
  const template = floors.map(f => f.track).join(" ");
  const minWidth = floors.reduce((n, f) => n + f.px, 0) + 12 * (columns.length - 1) + 30;
  const vars = { "--dt-cols": template, "--dt-min": `${minWidth}px` } as CSSProperties;
  return (
    <>
    <div className="omni-dt-scroll">
    <div role="table" className="omni-dt" style={vars}>
      <div role="row" className="omni-dt-row omni-dt-head">
        {columns.map(c => (
          <div role="columnheader" key={c.key} className="omni-dt-cell omni-dt-hide-sm" style={{ textAlign: c.align }}>
            <span style={clpText("caption", { muted: true, label: true })}>{c.header}</span>
          </div>
        ))}
      </div>
      {visible.map(row => {
        const key = rowKey(row);
        const selected = selectedKey === key || (isHighlighted?.(row) ?? false);
        const expanded = renderExpanded?.(row);
        return (
          <Fragment key={key}>
          <div
            role="row"
            className={`omni-dt-row${onRowClick ? " omni-dt-clickable" : ""}`}
            style={{ background: selected ? tint(ACCENT, 8) : CARD, borderColor: selected ? ACCENT : BORDER }}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); } } : undefined}
          >
            {columns.map(c => (
              <div
                role="cell" key={c.key} data-label={c.primary || typeof c.header !== "string" || !c.header ? undefined : c.header}
                className={`omni-dt-cell${c.primary ? " omni-dt-primary" : ""}${c.hideOnMobile ? " omni-dt-hide-sm" : ""}`}
                style={{ textAlign: c.align }}
              >
                {c.render(row)}
              </div>
            ))}
          </div>
          {expanded ? <div className="omni-dt-expanded">{expanded}</div> : null}
          </Fragment>
        );
      })}
    </div>
    </div>
    {pageSize ? <Pager pagination={pagination} /> : null}
    </>
  );
}
