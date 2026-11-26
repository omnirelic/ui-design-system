// Palette de commandes ⌘K (web/src/admin/CommandPalette.tsx de Chez la Petite) : raccourci ⌘K / Ctrl+K, recherche STRICTE (sous-chaîne, accents ignorés), flèches + Entrée,
// Échap ou clic sur le fond pour fermer. L'index vient du menu (permissions déjà appliquées) ; les réglages et fonctions sont des données de l'application.
import { useEffect, useMemo, useRef, useState } from "react";
import type { NavGroup } from "./admin-registry-types";
import { buildPaletteEntries, paletteKey, rankPalette, type PaletteEntry, type PaletteFeature, type PaletteSetting } from "./admin-palette-model";
import { Icon } from "./Icon";
import { fieldFocusStyle, useFieldFocus } from "./field-focus";
import { tint } from "./controls";
import { ACCENT, BG2, BORDER, DIM, MONO, TXT, rem } from "./theme";

export interface AdminCommandPaletteProps {
  navGroups: NavGroup[];
  setView: (v: string) => void;
  /** Ouvre le réglage choisi (CLP : change de vue puis met le champ en évidence). */
  onSelectSetting?: (fieldKey: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  features?: readonly PaletteFeature[];
  settings?: readonly PaletteSetting[];
  /** Vue dont la visibilité autorise l'index des réglages (CLP : « settings »). */
  settingsView?: string;
  placeholder?: string;
}

const MOTION_MODAL = "all 0.28s cubic-bezier(0.25,0.46,0.45,0.94)";
const MOTION_FAST = "all 0.15s ease";
const MODAL_SHADOW = "0 24px 64px color-mix(in srgb, black 60%, transparent)";
const BADGE = { flexShrink: 0, fontSize: rem(12), color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${BORDER}`, borderRadius: 3, padding: "2px 6px" } as const;

export function AdminCommandPalette({ navGroups, setView, onSelectSetting, open, onOpenChange, features, settings, settingsView, placeholder = "Rechercher un menu, une fonction ou un réglage…" }: AdminCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focus = useFieldFocus();

  // Échap ferme.
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onOpenChange]);

  // Raccourci global ⌘K / Ctrl+K : bascule l'ouverture.
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); onOpenChange(!open); }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onOpenChange]);

  const entries = useMemo(() => buildPaletteEntries({ navGroups, features, settings, settingsView }), [navGroups, features, settings, settingsView]);
  const results = useMemo(() => rankPalette(entries, query), [entries, query]);

  // Réinitialise saisie + sélection à chaque ouverture, focus l'input.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSel(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // Garde la sélection dans les bornes quand la liste change ; maintient l'item sélectionné visible.
  useEffect(() => { setSel(s => Math.min(s, Math.max(0, results.length - 1))); }, [results.length]);
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)?.scrollIntoView?.({ block: "nearest" }); }, [sel]);

  if (!open) return null;

  const go = (e: PaletteEntry) => {
    if (e.kind === "setting") onSelectSetting?.(e.fieldKey);
    else setView(e.key);
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[sel]) go(results[sel]); }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "color-mix(in srgb, black 82%, transparent)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12vh 24px 24px", fontFamily: MONO }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", transition: MOTION_MODAL, boxShadow: MODAL_SHADOW }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ color: DIM, display: "flex" }}><Icon name="action-search" size={14} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              ref={inputRef} value={query} placeholder={placeholder}
              onChange={e => { setQuery(e.target.value); setSel(0); }} onKeyDown={onKeyDown} onFocus={focus.onFocus} onBlur={focus.onBlur}
              style={{ width: "100%", minWidth: 0, boxSizing: "border-box", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 4, outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease", ...fieldFocusStyle(focus.focused), color: TXT, fontSize: rem(13), fontFamily: MONO, padding: "9px 12px" }}
            />
          </div>
          <span style={{ ...BADGE, textTransform: "none", letterSpacing: 0 }}>ESC</span>
        </div>

        <div ref={listRef} style={{ overflowY: "auto", padding: 6 }}>
          {results.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: DIM, fontSize: rem(13.5) }}>Aucun résultat.</div>
          ) : results.map((e, i) => {
            const active = i === sel;
            return (
              <div
                key={paletteKey(e)} data-idx={i} onClick={() => go(e)} onMouseEnter={() => setSel(i)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 4, cursor: "pointer",
                  background: active ? tint(ACCENT, 5) : "transparent", color: active ? ACCENT : TXT,
                  borderLeft: active ? `2px solid ${ACCENT}` : "2px solid transparent", transition: MOTION_FAST,
                }}
              >
                <span style={{ fontSize: rem(15), letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.label}
                  {e.kind !== "view" && <span style={{ color: DIM }}> · {e.group}</span>}
                </span>
                <span style={BADGE}>{e.kind === "setting" ? "Réglage" : e.kind === "feature" ? "Fonction" : e.group}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
