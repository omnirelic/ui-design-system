// @deprecated Alias conservé pour les consommateurs d'omnirelic (ange-raphael, components, web) : utiliser `Select` avec `searchable`.
// Depuis le lot 3 du désossage de CLP, le comportement est celui du `Select` de CLP (panneau en portail, clavier complet,
// focus rendu au déclencheur, recherche sans accent ni casse) ; seule l'API d'origine est gardée :
// `value` nullable, `options[].sub` (cherché aussi, affiché à droite), `placeholder`, `searchPlaceholder`, `pinnedOption`.
import { useMemo } from "react";
import { Select, type SelectOption } from "./Select";
import { DIM, MONO, rem } from "./theme";

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

function toOption(o: SearchableSelectOption, pinned?: boolean): SelectOption {
  return {
    value: o.value,
    label: o.sub
      ? <><span>{o.label}</span><span style={{ marginLeft: 8, color: DIM, fontFamily: MONO, fontSize: rem(11) }}>{o.sub}</span></>
      : o.label,
    short: o.label,
    search: o.sub ? `${o.label} ${o.sub}` : o.label,
    pinned,
  };
}

/** @deprecated Utiliser `Select` avec `searchable`. */
export function SearchableSelect({ value, onChange, options, placeholder = "Choisir…", searchPlaceholder = "Rechercher…", pinnedOption }: SearchableSelectProps) {
  const mapped = useMemo(() => [...options.map(o => toOption(o)), ...(pinnedOption ? [toOption(pinnedOption, true)] : [])], [options, pinnedOption]);
  return <Select searchable options={mapped} value={value ?? ""} onChange={onChange} placeholder={placeholder} searchPlaceholder={searchPlaceholder} />;
}
