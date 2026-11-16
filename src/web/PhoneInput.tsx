// Champ téléphone omnirelic : pays à gauche (drapeau + indicatif, recherche par nom ou indicatif, Cameroun par défaut),
// numéro national à droite, valeur émise en E.164. Valide par pays (libphonenumber-js). Mobile : clavier numérique.
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { BG, BORDER, TXT, DIM, DIM2, ACCENT, CARD, FONT } from "./theme";
import { radius } from "../tokens";
import { DEFAULT_COUNTRY, formatNational, isValidPhone, parseStoredPhone, phoneCountries, searchCountries, toE164, type CountryCode } from "./phone";

export interface PhoneChange { country: CountryCode; valid: boolean }
export interface PhoneInputProps {
  /** Valeur stockée : E.164, ou ancien numéro sans indicatif (lu comme celui du pays par défaut). */
  value: string | null | undefined;
  /** Reçoit l'E.164 (« +237641785415 »), ou « » si le champ est vide. */
  onChange: (e164: string, info: PhoneChange) => void;
  defaultCountry?: CountryCode;
  label?: string;
  /** Message d'erreur sobre ; sinon le champ signale seul un numéro invalide après la première perte de focus. */
  error?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: () => void;
}

export function PhoneInput({ value, onChange, defaultCountry = DEFAULT_COUNTRY, label, error, disabled, id, name, onBlur }: PhoneInputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const initial = useMemo(() => parseStoredPhone(value, defaultCountry), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [national, setNational] = useState(formatNational(initial.country, initial.national));
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // Valeur rechargée par le parent (autre fiche, enregistrement) : on relit le stocké, sans écraser une saisie en cours qui donne déjà la même valeur.
  useEffect(() => {
    if ((value ?? "") === toE164(country, national)) return;
    const p = parseStoredPhone(value, defaultCountry);
    setCountry(p.country); setNational(formatNational(p.country, p.national));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);

  const countries = useMemo(() => phoneCountries(), []);
  const found = useMemo(() => searchCountries(countries, query), [countries, query]);
  const current = countries.find(c => c.code === country)!;
  const valid = isValidPhone(country, national);
  const invalid = !!error || (touched && national.trim() !== "" && !valid);
  const border = invalid ? "var(--o-danger, #F43F5E)" : focused ? ACCENT : BORDER;

  const emit = (c: CountryCode, text: string) => onChange(toE164(c, text), { country: c, valid: isValidPhone(c, text) });
  const pick = (c: CountryCode | undefined) => { if (!c) return; setCountry(c); setNational(formatNational(c, national)); setOpen(false); setQuery(""); emit(c, national); };
  const onSearchKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter") { e.preventDefault(); pick(found[index]?.code); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setIndex(i => Math.min(i + 1, found.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
  };

  return (
    <div ref={root} style={{ position: "relative", textAlign: "left" }}>
      {label && <label htmlFor={fieldId} style={{ display: "block", fontSize: FONT.label, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM2, marginBottom: 6 }}>{label}</label>}
      <div data-invalid={invalid || undefined} data-disabled={disabled || undefined} style={{ display: "flex", alignItems: "stretch", height: 44, borderRadius: radius.md, border: `1px solid ${border}`, background: BG, opacity: disabled ? 0.5 : 1, boxShadow: focused && !invalid ? `0 0 0 2px color-mix(in srgb, ${ACCENT} 25%, transparent)` : undefined }}>
        <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={`Pays : ${current.name} ${current.dial}`} onClick={() => { setOpen(o => !o); setIndex(0); }}
          style={{ all: "unset", boxSizing: "border-box", display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", cursor: disabled ? "not-allowed" : "pointer", color: TXT, fontSize: FONT.base, fontWeight: 600, borderRight: `1px solid ${BORDER}` }}>
          <span aria-hidden>{current.flag}</span><span>{current.dial}</span>
          <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden><path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
        </button>
        <input id={fieldId} name={name} type="tel" inputMode="tel" autoComplete="tel-national" disabled={disabled} value={national} aria-invalid={invalid || undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); onBlur?.(); }}
          onChange={e => { const text = formatNational(country, e.target.value); setNational(text); emit(country, text); }}
          style={{ all: "unset", boxSizing: "border-box", flex: 1, minWidth: 0, padding: "0 12px", color: TXT, fontSize: FONT.base, fontWeight: 600 }} />
      </div>
      {error && <div role="alert" style={{ marginTop: 4, fontSize: FONT.label, color: "var(--o-danger, #F43F5E)" }}>{error}</div>}
      {open && (
        <div style={{ position: "absolute", zIndex: 30, top: "100%", left: 0, marginTop: 4, width: "min(320px, 100%)", background: CARD, border: `1px solid ${BORDER}`, borderRadius: radius.md, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,.45)" }}>
          <input ref={search} value={query} onChange={e => { setQuery(e.target.value); setIndex(0); }} onKeyDown={onSearchKey} placeholder="Pays ou indicatif" aria-label="Rechercher un pays" autoComplete="off"
            style={{ all: "unset", boxSizing: "border-box", width: "100%", padding: "10px 12px", borderBottom: `1px solid ${BORDER}`, color: TXT, fontSize: FONT.base }} />
          <ul role="listbox" style={{ listStyle: "none", margin: 0, padding: 4, maxHeight: 240, overflowY: "auto" }}>
            {found.map((c, i) => (
              <li key={c.code} role="option" aria-selected={c.code === country} onMouseEnter={() => setIndex(i)} onMouseDown={e => { e.preventDefault(); pick(c.code); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: radius.sm, cursor: "pointer", fontSize: FONT.base, color: i === index ? ACCENT : TXT, background: i === index ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : "transparent" }}>
                <span aria-hidden>{c.flag}</span><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span><span style={{ color: DIM }}>{c.dial}</span>
              </li>
            ))}
            {found.length === 0 && <li style={{ padding: "8px 10px", color: DIM }}>Aucun résultat</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
