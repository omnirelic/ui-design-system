// Pagination de CLP (web/src/ui/Pagination.tsx) : ← 1 … n-1 n n+1 … N →, page courante teintée, rien si une seule page.
import { ACCENT, BORDER, CARD, DIM, MONO, TXT, rem } from "./theme";
import { tint } from "./controls";

export type PaginationProps = { page: number; totalPages: number; onChange: (p: number) => void };

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginTop: 20 }}>
      <PageBtn label="←" disabled={page === 1} onClick={() => onChange(page - 1)} />
      {pages.map((p, i) =>
        p === "…"
          ? <span key={i} style={{ color: DIM, fontSize: rem(10), padding: "0 4px" }}>…</span>
          : <PageBtn key={p} label={String(p)} active={p === page} onClick={() => onChange(p)} />,
      )}
      <PageBtn label="→" disabled={page === totalPages} onClick={() => onChange(page + 1)} />
    </div>
  );
}

function PageBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? tint(ACCENT, 13) : CARD, border: `1px solid ${active ? ACCENT : BORDER}`, color: active ? ACCENT : disabled ? DIM : TXT,
        borderRadius: 4, padding: "5px 10px", fontSize: rem(10), fontFamily: MONO, cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease", opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}
