// Dropdown avec recherche interne — même comportement qu'un <select> standard
// vu de l'extérieur (fermé par défaut, une ligne, chevron), mais ouvre un
// panneau filtrable au clic. Sert au moins deux fois dans le portail
// self-service (succursale, type de lieu) — d'où la variante Reactive
// "chip" déjà commentée "Pastille/select custom (succursale, lieu de
// livraison)" avant même que ce fichier existe. Reste utilisable avec des
// dizaines d'options, jamais un <select> à N options.
import { useEffect, useRef, useState } from "react";
import { Reactive } from "./Reactive";
import { TextInput } from "./Field";
import { CARD, TXT, DIM, DIM2, BORDER, ACCENT, FONT } from "./theme";
import { radius } from "../tokens";
import { IconChevronDown } from "./icons";

export type SearchableSelectOption = { value: string; label: string; sub?: string };

export type SearchableSelectProps = {
  value: string | null;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Ligne épinglée en bas de la liste, toujours visible même en recherche (ex. "+ Nouvelle succursale…"). */
  pinnedOption?: SearchableSelectOption;
};

export function SearchableSelect({ value, onChange, options, placeholder = "Choisir…", searchPlaceholder = "Rechercher…", pinnedOption }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? (pinnedOption?.value === value ? pinnedOption : undefined);
  const q = query.trim().toLowerCase();
  const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q)) : options;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <Reactive
        as="button"
        type="button"
        variant="chip"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
          requestAnimationFrame(() => searchRef.current?.focus());
        }}
        style={{
          width: "100%", height: 44, borderRadius: radius.md, border: `1px solid ${BORDER}`, background: "var(--o-bg, #0a0a0b)",
          color: selected ? TXT : "#5a5a62", fontFamily: "inherit", fontSize: FONT.base, fontWeight: 600, padding: "0 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{ color: DIM, display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>
          <IconChevronDown size={14} />
        </span>
      </Reactive>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: radius.md, padding: 8, boxShadow: "0 16px 36px rgba(0,0,0,.45)" }}>
          <TextInput ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} style={{ marginBottom: 8 }} />
          <div style={{ maxHeight: 180, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: radius.sm + 4 }}>
            {matches.length === 0 && <div style={{ padding: 12, textAlign: "center", fontSize: FONT.body, color: DIM2 }}>Aucun résultat.</div>}
            {matches.map((o) => (
              <OptionRow key={o.value} option={o} selected={o.value === value} onClick={() => { onChange(o.value); setOpen(false); }} />
            ))}
            {pinnedOption && <OptionRow option={pinnedOption} selected={pinnedOption.value === value} accent onClick={() => { onChange(pinnedOption.value); setOpen(false); }} />}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({ option, selected, accent, onClick }: { option: SearchableSelectOption; selected: boolean; accent?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px",
        borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontSize: FONT.body,
        background: selected ? "#0f1a19" : "transparent", color: selected || accent ? ACCENT : TXT, fontWeight: selected || accent ? 700 : 400,
      }}
    >
      <span>{option.label}</span>
      {option.sub && <span style={{ fontSize: FONT.caption, color: DIM, fontFamily: "Space Grotesk, monospace" }}>{option.sub}</span>}
    </div>
  );
}
