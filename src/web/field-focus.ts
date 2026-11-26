// Convention de focus des champs de CLP (web/src/ui/field.ts) : bordure d'accent + halo doux (une bordure seule est trop subtile sur fond sombre). Interne au paquet.
import { useCallback, useState, type CSSProperties } from "react";
import { ACCENT, BORDER } from "./theme";
import { tint } from "./controls";
import { toneColor } from "./pastille-model";

const RD = toneColor("danger");

export const fieldBorderColor = (focused: boolean, error?: boolean): string => (error ? RD : focused ? ACCENT : BORDER);

/** Halo de focus (rien au repos). Rouge si erreur, accent sinon. */
export const fieldFocusRing = (focused: boolean, error?: boolean): string => (focused ? `0 0 0 3px ${tint(error ? RD : ACCENT, 13)}` : "none");

/** Bordure + halo à étaler sur un champ ou un conteneur de saisie selon (focused, error). */
export const fieldFocusStyle = (focused: boolean, error?: boolean): CSSProperties => ({ borderColor: fieldBorderColor(focused, error), boxShadow: fieldFocusRing(focused, error) });

/** Focus pour un conteneur de saisie personnalisé (la barre de VoiceTextInput). */
export function useFieldFocus() {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  return { focused, onFocus, onBlur };
}
