// Barre de pagination de l'admin de CLP (web/src/admin/ui/Pager.tsx) : « 1–10 sur 30 », ← 1 … n-1 n n+1 … N →, choix « 10 / page ».
// Masquée tant que la liste tient sur la plus petite page. Distincte de `Pagination` (simple, sans total ni taille de page).
import { ControlButton } from "./controls";
import { Select } from "./Select";
import { PAGE_SIZES, type PaginationState } from "./usePagination";
import { clpText } from "./clp-text";
import { rem } from "./theme";
import "./data-table-css";

/** Pages à afficher : 1, la page courante ±1 et la dernière, séparées par « … ». */
function windowed(page: number, pageCount: number): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) out.push(i);
    else if (out[out.length - 1] !== "gap") out.push("gap");
  }
  return out;
}

export type PagerProps = { pagination: PaginationState<unknown>; sizes?: readonly number[] };

export function Pager({ pagination: p, sizes = PAGE_SIZES }: PagerProps) {
  if (p.total <= sizes[0]) return null;
  return (
    <nav aria-label="Pagination" className="omni-pager">
      <span style={clpText("small", { muted: true })}>{p.from}–{p.to} sur {p.total}</span>
      <div className="omni-pager-pages">
        <ControlButton size="sm" aria-label="Page précédente" title="Page précédente" disabled={p.page <= 1} onClick={() => p.setPage(p.page - 1)}>←</ControlButton>
        {windowed(p.page, p.pageCount).map((n, i) => n === "gap"
          ? <span key={`g${i}`} style={clpText("small", { muted: true })}>…</span>
          : <ControlButton key={n} size="sm" variant="seg" aria-pressed={n === p.page} aria-label={`Page ${n}`} onClick={() => p.setPage(n)}>{n}</ControlButton>)}
        <ControlButton size="sm" aria-label="Page suivante" title="Page suivante" disabled={p.page >= p.pageCount} onClick={() => p.setPage(p.page + 1)}>→</ControlButton>
      </div>
      <div className="omni-pager-size" style={{ minWidth: rem(110) }}>
        <Select ariaLabel="Éléments par page" value={String(p.pageSize)} onChange={v => p.setPageSize(Number(v))}
          options={sizes.map(n => ({ value: String(n), label: `${n} / page` }))} />
      </div>
    </nav>
  );
}
