import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import { Z, tint } from "./controls";
import { ACCENT, BG, BORDER, CARD, DIM, MONO, TXT, rem } from "./theme";

// Déclencheur, panneau et options : mêmes mesures que CLP ; les couleurs sont les jetons du thème (--o-*).
// Feuille de CLP controls.css (anneau de focus au clavier, options plus hautes au doigt), posée une fois dans <head>.
const SELECT_CSS = `
.omni-select-btn:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px}
.omni-select-opt{outline:none}
.omni-select-opt:focus-visible{outline:2px solid ${ACCENT};outline-offset:-2px;background:${tint(TXT, 10)}}
@media (max-width:640px){.omni-select-opt{min-height:40px}}
`;
if (typeof document !== "undefined" && !document.getElementById("omni-select")) {
  const style = document.createElement("style");
  style.id = "omni-select";
  style.textContent = SELECT_CSS;
  document.head.appendChild(style);
}
const FS = { base: 12, lg: 13 } as const;
const PANEL_BG = CARD, HOVER_BG = tint(TXT, 10);

export interface SelectOption {
  value: string;
  /** ReactNode (pas juste string) — un appelant peut styler une partie du libellé (ex. un préfixe
   * "2x" en gras/couleur) sans réinventer tout le rendu de l'option. */
  label: ReactNode;
  /** Libellé court montré dans le déclencheur à la place de `label` (ex. « USD » quand l'option détaille le taux). */
  short?: ReactNode;
  /** Texte filtré par la recherche (`searchable`) quand `label` n'est pas une chaîne. */
  search?: string;
  /** Option visible mais non choisissable (grisée). */
  disabled?: boolean;
  /** Ajout omnirelic : toujours visible, en bas de liste, même quand la recherche ne la retient pas (ex. « + Nouvelle succursale… »). */
  pinned?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  /** Couleurs à surcharger (storefront/partenaire) — défaut : palette admin (tokens.ts). */
  border?: string;
  text?: string;
  background?: string;
  accent?: string;
  uiSize?: "sm" | "md";
  /** Hauteur fixe en px (ex. pour aligner avec un QtyButton voisin) — remplace le calcul par
   * padding de `uiSize` quand fourni. */
  height?: number;
  /** Largeur max du déclencheur en px — pour les barres de filtres, où un select pleine largeur
   * s'étire sur toute la ligne. Sans cette prop : 100 % du conteneur (formulaires, drawers). */
  width?: number;
  /** Champ de recherche en tête du panneau : filtre les options à la frappe (listes longues, vue mobile). */
  searchable?: boolean;
  /** Déclencheur réduit à une icône + chevron (teintée quand un filtre est actif, c.-à-d. hors 1re option). Panneau aligné à droite du bouton. */
  icon?: IconName;
  /** Sans cadre, fond ni arrondi : le conteneur porte le contour (groupe accolé à un champ). */
  bare?: boolean;
  /** Ajout omnirelic : texte du déclencheur quand rien n'est choisi (CLP : vide). */
  placeholder?: string;
  /** Ajout omnirelic : texte du champ de recherche (CLP : « Rechercher… »). */
  searchPlaceholder?: string;
}

// Dropdown MAISON de CLP (web/src/ui/Select.tsx), partagé admin + storefront (aucun composant Select n'existait — chaque écran
// refaisait un <select> non stylé ou des pastilles radio). Un <select> natif a été essayé en
// premier, mais son panneau d'options est rendu par l'OS (blanc/bleu système, incontournable en
// CSS) — retour utilisateur explicite : "ton select est laid". Ce panneau-ci est un vrai <div>
// stylé comme le reste du design system. Le déclencheur garde une largeur STATIQUE (celle de son
// conteneur, jamais celle du libellé sélectionné — retour utilisateur) : texte tronqué, pas de
// redimensionnement au changement de sélection. Le PANNEAU, lui, est rendu en portail
// (position: fixed) : en absolu il était rogné par l'overflow d'un parent (carte, drawer) et
// tronquait les libellés à la largeur du bouton — il prend maintenant au moins la largeur du
// bouton, s'élargit au contenu, et s'ouvre vers le haut s'il manque de place en dessous.
const PANEL_MAX_H = 220, GAP = 6;
/** Minuscules sans accents : « bat » retrouve « Bâton ». */
const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
interface PanelPos { left?: number; right?: number; minWidth: number; top?: number; bottom?: number; maxHeight: number }
export function Select({ options, value, onChange, ariaLabel, disabled, border = BORDER, text = TXT, background = "transparent", accent = ACCENT, uiSize = "md", height, width, searchable, icon, bare, placeholder, searchPlaceholder = "Rechercher…" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<PanelPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const padY = uiSize === "sm" ? 7 : 10, fontSize = rem(uiSize === "sm" ? FS.base : FS.lg);
  const selected = options.find(o => o.value === value);
  const active = icon != null && value !== (options[0]?.value ?? "");
  const q = searchable ? norm(query) : "";
  const shown = q ? options.filter(o => o.pinned || norm(o.search ?? (typeof o.label === "string" ? o.label : "")).includes(q)) : options;
  // Épinglées en bas, dans l'ordre reçu.
  const ordered = shown.some(o => o.pinned) ? [...shown.filter(o => !o.pinned), ...shown.filter(o => o.pinned)] : shown;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - GAP - 8, above = r.top - GAP - 8;
      const up = below < Math.min(PANEL_MAX_H, 140) && above > below;
      const maxHeight = Math.max(80, Math.min(PANEL_MAX_H, up ? above : below));
      const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
      const x = icon ? { right: Math.max(8, window.innerWidth - r.right) } : { left };
      setPos(up ? { ...x, minWidth: r.width, bottom: window.innerHeight - r.top + GAP, maxHeight } : { ...x, minWidth: r.width, top: r.bottom + GAP, maxHeight });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, icon]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const enabledOptions = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? []);
  // Clavier : à l'ouverture le focus va sur l'option choisie (ou la première), comme un menu natif.
  useEffect(() => {
    if (!open || !pos || searchable) return;
    const list = enabledOptions();
    (list.find(o => o.getAttribute("aria-selected") === "true") ?? list[0])?.focus({ preventScroll: true });
  }, [open, pos, searchable]);
  const closeToTrigger = () => { setOpen(false); triggerRef.current?.focus({ preventScroll: true }); };
  const onPanelKey = (e: React.KeyboardEvent) => {
    const list = enabledOptions();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (el?: HTMLElement) => { e.preventDefault(); el?.focus({ preventScroll: true }); };
    if (e.key === "ArrowDown") go(list[Math.min(at + 1, list.length - 1)]);
    else if (e.key === "ArrowUp") go(at <= 0 ? list[0] : list[at - 1]);
    else if (e.key === "Home") go(list[0]);
    else if (e.key === "End") go(list[list.length - 1]);
    else if ((e.key === "Enter" || e.key === " ") && at >= 0) { e.preventDefault(); list[at].click(); triggerRef.current?.focus({ preventScroll: true }); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeToTrigger(); }
    else if (e.key === "Tab") setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={rootRef} className="omni-select" style={{ position: "relative", width: icon ? "auto" : "100%", maxWidth: width, alignSelf: icon ? "stretch" : undefined, display: icon ? "flex" : undefined }}>
      <button
        ref={triggerRef}
        type="button"
        className="omni-select-btn"
        aria-label={ariaLabel}
        title={icon ? (active && typeof selected?.label === "string" ? `${ariaLabel} : ${selected.label}` : ariaLabel) : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={e => { if (!disabled && !open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setOpen(true); } }}
        style={{
          width: "100%", height, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", gap: icon ? 4 : 8,
          background: bare ? (open ? tint(TXT, 5) : "transparent") : background, color: disabled ? DIM : text, border: bare ? "none" : `1px solid ${open ? accent : border}`, borderRadius: bare ? 0 : 8,
          padding: icon ? `0 ${rem(8)}` : height ? "0 10px 0 12px" : `${padY}px 10px ${padY}px 12px`, fontFamily: MONO, fontSize,
          cursor: disabled ? "not-allowed" : "pointer", transition: "border-color 0.15s",
        }}
      >
        {icon
          ? <Icon name={icon} size={16} color={active ? accent : DIM} />
          : <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left", color: selected || placeholder == null || disabled ? undefined : DIM }}>{selected?.short ?? selected?.label ?? placeholder ?? ""}</span>}
        <Icon name="ui-chevron-down" size={13} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && pos && createPortal(
        <div ref={panelRef} role="listbox" aria-label={ariaLabel} onKeyDown={onPanelKey} style={{
          position: "fixed", ...pos, width: "max-content", maxWidth: "calc(100vw - 16px)", zIndex: Z.popup, boxSizing: "border-box",
          background: PANEL_BG, border: `1px solid ${border}`, borderRadius: 8,
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)", overflow: "hidden auto",
        }}>
          {searchable && (
            <div style={{ position: "sticky", top: 0, zIndex: 1, background: PANEL_BG, padding: 8, borderBottom: `1px solid ${border}` }}>
              <input autoFocus type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label="Rechercher dans la liste"
                style={{ width: "100%", boxSizing: "border-box", background: BG, color: TXT, border: `1px solid ${border}`, borderRadius: 6, padding: "8px 10px", fontFamily: MONO, fontSize, outline: "none" }} />
            </div>
          )}
          {searchable && !ordered.some(o => !o.pinned) && <div style={{ padding: "10px 12px", color: DIM, fontFamily: MONO, fontSize }}>Aucun résultat</div>}
          {ordered.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option" className="omni-select-opt" tabIndex={-1}
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onClick={() => { if (opt.disabled) return; onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  padding: "10px 12px", fontFamily: MONO, fontSize,
                  color: opt.disabled ? DIM : isSelected ? accent : TXT, background: isSelected ? tint(accent, 11) : "transparent",
                  cursor: opt.disabled ? "not-allowed" : "pointer", opacity: opt.disabled ? 0.55 : 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
                onMouseEnter={e => { if (!isSelected && !opt.disabled) e.currentTarget.style.background = HOVER_BG; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{opt.label}</span>
                {isSelected && <Icon name="status-check" size={13} style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
