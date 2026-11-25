// Reprise TELLE QUELLE de Chez la Petite (web/src/account/PhoneField.tsx, CLP gelé) : mêmes props, états, tailles, comportements.
// Champ numéro international : sélecteur d'indicatif (drapeau + +NNN) puis numéro, tenus par le parent (pays + saisie brute ;
// `resolvePhone` donne l'E.164). La liste s'ouvre VERS LE HAUT (champ en bas d'un tiroir, à portée du pouce).
// Seul écart voulu : les couleurs viennent du thème omnirelic (ACCENT, CARD, BORDER, TXT, DIM) au lieu des hex de CLP — c'est ce
// qui permet à cuisines.cm de n'ajouter que ses couleurs. Drapeaux en SVG intégrés (phone-flags.ts), jamais d'emoji.
import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENT, BG, BORDER, CARD, DIM, MONO, TXT } from "./theme";
import { PHONE_COUNTRIES, filterCountries, type PhoneCountry } from "./phone-intl";
import { PHONE_FLAGS } from "./phone-flags";

const mono = { fontFamily: MONO } as const;
const HOVER = `color-mix(in srgb, ${TXT} 8%, transparent)`;
const SELECTED = `color-mix(in srgb, ${ACCENT} 12%, transparent)`;

function Flag({ iso }: { iso: string }) {
  return (
    <img src={PHONE_FLAGS[iso.toLowerCase()]} alt="" width={24} height={18}
      style={{ borderRadius: 3, boxShadow: "0 0 0 1px rgba(255,255,255,.14)", flexShrink: 0, objectFit: "cover" }} />
  );
}

export interface PhoneFieldProps {
  country: PhoneCountry;
  value: string;
  onCountry: (c: PhoneCountry) => void;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  autoFocus?: boolean;
  errorId?: string;
}

export function PhoneField({ country, value, onCountry, onChange, onBlur, invalid, autoFocus, errorId }: PhoneFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const findRef = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => filterCountries(PHONE_COUNTRIES, query), [query]);

  useEffect(() => {
    if (!open) return;
    findRef.current?.focus();
    const away = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  function pick(c: PhoneCountry) { onCountry(c); setOpen(false); setQuery(""); }

  return (
    <div ref={boxRef} className="o-phone-field" style={{
      ...mono, position: "relative", display: "flex", background: CARD, borderRadius: 10,
      border: `1px solid ${invalid ? "var(--o-danger, #e66)" : BORDER}`,
    }}>
      <style>{`.o-phone-field:focus-within{border-color:${ACCENT} !important;box-shadow:0 0 0 2px color-mix(in srgb, ${ACCENT} 40%, transparent)}`}</style>
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={`Indicatif : ${country.name} +${country.dial}`}
        style={{ ...mono, display: "flex", alignItems: "center", gap: 8, background: open ? HOVER : "none", border: "none", borderRight: `1px solid ${BORDER}`, borderRadius: "10px 0 0 10px", color: TXT, fontSize: 14, fontWeight: 700, padding: "0 12px", cursor: "pointer", transition: "background .15s" }}>
        <Flag iso={country.iso} />
        <span>+{country.dial}</span>
        <span style={{ fontSize: 10, color: DIM }}>▾</span>
      </button>
      <input value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        inputMode="tel" autoComplete="tel-national" autoFocus={autoFocus}
        placeholder={country.iso === "CM" ? "6 50 00 00 00" : "Numéro"} aria-label="Numéro WhatsApp" aria-invalid={invalid ? "true" : undefined} aria-describedby={invalid ? errorId : undefined}
        style={{ ...mono, flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: TXT, fontSize: 15, padding: "13px 12px", letterSpacing: 0.3 }} />

      {open && (
        <div role="listbox" style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 5, overflow: "hidden",
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.6)",
        }}>
          <input ref={findRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un pays" autoComplete="off"
            style={{ ...mono, width: "100%", background: BG, border: "none", borderBottom: `1px solid ${BORDER}`, color: TXT, fontSize: 14, padding: "12px 14px", outline: "none" }} />
          <div style={{ maxHeight: 130, overflowY: "auto" }}>
            {rows.length === 0 && <div style={{ padding: 14, color: DIM, fontSize: 13 }}>Aucun pays</div>}
            {rows.map(c => (
              <div key={c.iso} role="option" aria-selected={c.iso === country.iso} onClick={() => pick(c)}
                onMouseEnter={() => setHover(c.iso)} onMouseLeave={() => setHover(null)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", fontSize: 14, color: TXT, cursor: "pointer",
                  background: hover === c.iso ? HOVER : c.iso === country.iso ? SELECTED : "transparent", transition: "background .12s" }}>
                <Flag iso={c.iso} />
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ color: DIM, fontWeight: 700 }}>+{c.dial}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
