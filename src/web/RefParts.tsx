// Briques communes des composants d'entités (web/src/admin/ui/entity/RefParts.tsx de CLP). La vue choisit la FORME (`variant`) ; le clic, le menu d'actions au survol et les
// formats viennent d'ici. Styles : `.omni-ref*` (entity-css.ts).
// Écarts : le lien est celui de react-router-dom (peerDependency optionnelle, comme /query-params) ; l'action `run` est un ControlButton nu et sans infobulle en écho du libellé
// (CLP : ActionButton avec `tooltip={a.label}`) ; idem pour la copie (pas de `tooltip` : `title` = écho du libellé) ; l'action désactivée prend les classes `.omni-ref-off` (CLP : style en ligne gris).
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ControlButton } from "./controls";
import { CopyButton } from "./CopyButton";
import { Icon } from "./Icon";
import { RefText } from "./entity-text";
import { HoverCard } from "./HoverCard";
import "./entity-css";

/** `num` : lien discret dans une phrase · `point` : disque seul + point d'état · `compact` : disque + libellé, bordé · `chip` : la pastille complète · `row` · `card` · `detail`. */
export type RefVariant = "num" | "point" | "compact" | "chip" | "row" | "card" | "detail";

/**
 * Action du menu qui s'ouvre au survol d'une pastille : un lien de l'application (`to`), un lien externe (`href`), une copie (texte, ou fonction évaluée au clic),
 * ou une action de la vue (`run` : ex. retrouver puis ouvrir la conversation d'un contact — l'URL n'est connue qu'après lecture).
 */
export interface RefAction { label: string; to?: string; href?: string; copy?: string | (() => string | Promise<string>); run?: () => void; /** Visible mais grisée, sans effet (pas d'appel). `reason` : 6 mots au plus, seulement s'il apprend quelque chose. */ disabled?: boolean; reason?: string }

export function Dot({ color }: { color: string }) {
  return <span aria-hidden className="omni-ref-dot" style={{ background: color }} />;
}

/** Pastille ronde pleine : la vraie couleur d'un sac physique. Sans couleur définie : gris, jamais une couleur inventée. */
export function Swatch({ color, size = 14 }: { color: string | null; size?: number }) {
  return <span aria-hidden className={color ? "omni-ref-swatch" : "omni-ref-swatch omni-ref-swatch-none"} style={{ width: size, height: size, background: color ?? undefined }} />;
}

export function Sep() { return <span aria-hidden className="omni-ref-sep">|</span>; }

/**
 * Ce qui s'ouvre au clic : le lien profond de l'entité, ou `onOpen` quand la vue ouvre déjà la fiche elle-même (tiroir local).
 * Sans `to` : texte simple, pas de lien mort.
 */
export function RefLink({ to, onOpen, title, className, style, children }: { to: string | null; onOpen?: () => void; title?: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  if (!to) return <span className={className} style={style}>{children}</span>;
  return (
    <Link to={to} title={title} className={className} style={style} onClick={onOpen ? (e => { e.preventDefault(); onOpen(); }) : undefined}>
      {children}
    </Link>
  );
}

/** Menu d'actions partagées : le contenu de la carte qui s'ouvre au survol ou au focus de la pastille (`HoverCard`). */
export function RefMenu({ actions, bare }: { actions: RefAction[]; /** Dans une carte qui a déjà sa surface : liste seule, sous un filet. */ bare?: boolean }) {
  if (!actions.length) return null;
  return (
    <span className={bare ? "omni-ref-pop omni-ref-pop--bare" : "omni-ref-pop"} role="menu">
      {actions.map(a => a.disabled
        ? <button key={a.label} type="button" role="menuitem" aria-disabled="true" tabIndex={-1} title={a.reason} className="omni-ref-off" onClick={e => e.stopPropagation()}><RefText variant="small">{a.label}</RefText></button>
        : a.to
        ? <Link key={a.label} to={a.to} role="menuitem" className="omni-ref-item"><RefText variant="small">{a.label}</RefText><Icon name="ui-chevron-right" size={12} /></Link>
        : a.run
        ? <ControlButton key={a.label} variant="bare" size="raw" className="omni-ref-item" aria-label={a.label} role="menuitem" onClick={e => { e.stopPropagation(); a.run!(); }}
            style={{ width: "100%", justifyContent: "space-between", textAlign: "left", color: "inherit", fontFamily: "inherit", minHeight: "auto", border: 0, padding: "6px 10px", whiteSpace: "nowrap" }}><RefText variant="small">{a.label}</RefText><Icon name="ui-chevron-right" size={12} /></ControlButton>
        : a.href
        ? <a key={a.label} href={a.href} role="menuitem" className="omni-ref-item" {...(a.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : null)}><RefText variant="small">{a.label}</RefText><Icon name="ui-chevron-right" size={12} /></a>
        : <CopyButton key={a.label} variant="bare" text={a.copy ?? ""} label={a.label} wide />)}
    </span>
  );
}

/** Pastille cliquable : la capsule (`<PastilleCapsule>`) dans son lien, avec son menu d'actions ou sa fiche rapide au survol. */
export function RefChipShell({ to, onOpen, title, actions = [], card, capsule }: { to: string | null; onOpen?: () => void; title?: string; actions?: RefAction[]; /** Carte de l'entité au survol (reprend elle-même les actions) ; sans elle, le menu d'actions seul. */ card?: ReactNode; /** `<PastilleCapsule>` : elle porte seule son contour, son disque de tête et ses segments. */ capsule: ReactNode }) {
  return (
    <HoverCard className="omni-ref" disabled={!card && !actions.length} label={card ? "Fiche rapide" : "Actions"} content={card ?? <RefMenu actions={actions} />}>
      {open => (
        // Le menu ouvert remplace l'infobulle de la pastille : sinon « Ouvrir : livreur » se pose sur la carte.
        <RefLink to={to} onOpen={onOpen} title={open ? undefined : title} className="omni-pst-link">{capsule}</RefLink>
      )}
    </HoverCard>
  );
}

/** Numéro seul : lien discret ; quand l'entité a une carte, elle s'ouvre au survol (comme sur la pastille). */
export function RefNumShell({ to, onOpen, title, label, card, children }: { to: string | null; onOpen?: () => void; title?: string; label?: string; card?: ReactNode; children: ReactNode }) {
  return (
    <HoverCard disabled={!card} label={label} content={card}>
      {open => <RefLink to={to} onOpen={onOpen} title={open ? undefined : title} className="omni-ref-num">{children}</RefLink>}
    </HoverCard>
  );
}

/** Ligne de liste : contenu à gauche, actions discrètes à droite (visibles au survol). */
export function RefRowShell({ children, end, className }: { children: ReactNode; end?: ReactNode; className?: string }) {
  return <div className={className ? `omni-ref-row ${className}` : "omni-ref-row"}>{children}{end && <span className="omni-ref-act">{end}</span>}</div>;
}

/** Carte : bandeau teinté (identité), corps, pied. `tint` = couleur de l'état (écart : mélangée par `color-mix`, CLP suffixait `1f` à un hexadécimal). */
export function RefCardShell({ tint, band, children, foot }: { tint?: string; band: ReactNode; children?: ReactNode; foot?: ReactNode }) {
  return (
    <div className="omni-ref-card">
      <div className="omni-ref-band" style={tint ? { background: `color-mix(in srgb, ${tint} 12%, transparent)` } : undefined}>{band}</div>
      {children && <div className="omni-ref-body">{children}</div>}
      {foot && <div className="omni-ref-foot">{foot}</div>}
    </div>
  );
}

/**
 * En-tête de tiroir (`detail`) : visuel à gauche, identité (titre, pastille d'état, précisions) au milieu, `extra` à droite
 * ou dessous pour les contrôles de la vue. Jamais un lien : on est déjà dans la fiche.
 */
export function RefDetailShell({ lead, title, badge, lines, extra }: { lead?: ReactNode; title: ReactNode; badge?: ReactNode; lines?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="omni-ref-detail">
      {lead}
      <span className="omni-ref-stack omni-ref-fill">
        <span className="omni-ref-detail-title">{title}{badge}</span>
        {lines}
        {extra}
      </span>
    </div>
  );
}
