// Second niveau d'onglets (web/src/admin/ui/SectionRail.tsx de Chez la Petite) : une colonne verticale à gauche, un seul bloc visible à droite ; avec une seule section,
// le rail disparaît. La section ouverte est portée par l'URL : `createRailSectionHook(useQueryParam)` (branché sur le routeur dans `/query-params`).
import "./admin-shell-css";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface RailItem<K extends string> {
  key: K;
  label: string;
  icon?: IconName;
  /** Nombre de lignes / champs ; omis quand il ne dit rien. */
  count?: number;
  /** Pastille d'alerte : une action est attendue dans cette section. */
  alert?: boolean;
}

export interface SectionRailProps<K extends string> {
  items: RailItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Titre discret au-dessus des entrées (« Sections », « Tableaux »…). */
  title?: string;
  /** Petites actions de la rubrique (export, aide) : sur la ligne du titre. */
  titleActions?: ReactNode;
  children: ReactNode;
}

export function SectionRail<K extends string>({ items, value, onChange, title, titleActions, children }: SectionRailProps<K>) {
  if (items.length < 2) return <>{children}</>;
  return (
    <div className="omni-shell-rail-layout">
      <nav className="omni-shell-rail" role="tablist" aria-orientation="vertical" aria-label={title ?? "Sections"}>
        {title && (
          <div className="omni-shell-rail-title">
            <span className="omni-shell-rail-title-text">{title}</span>
            {titleActions && <span className="omni-shell-rail-actions">{titleActions}</span>}
          </div>
        )}
        {items.map(it => (
          <button key={it.key} type="button" role="tab" className="omni-shell-rail-item" aria-selected={it.key === value} onClick={() => onChange(it.key)}>
            {it.icon && <span className="omni-shell-rail-icon"><Icon name={it.icon} size={15} /></span>}
            <span className="omni-shell-rail-label">{it.label}</span>
            {it.count !== undefined && <span className={`omni-shell-rail-count${it.alert ? " alert" : ""}`}>{it.count}</span>}
          </button>
        ))}
      </nav>
      <div className="omni-shell-rail-pane" role="tabpanel">{children}</div>
    </div>
  );
}

/**
 * Hook de la section ouverte, portée par l'URL (`?<param>=`). Une valeur inconnue ou périmée retombe sur la première section ;
 * la première section n'écrit rien dans l'URL (lien propre).
 */
export function createRailSectionHook(useQueryParam: (key: string) => [string | null, (value: string | null) => void]) {
  return function useRailSection<K extends string>(param: string, items: RailItem<K>[]): [K, (key: K) => void] {
    const [raw, setRaw] = useQueryParam(param);
    const value = (items.find(i => i.key === raw)?.key ?? items[0]?.key) as K;
    const set = (key: K) => setRaw(key === items[0]?.key ? null : key);
    return [value, set];
  };
}
