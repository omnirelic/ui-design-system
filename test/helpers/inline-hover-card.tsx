import type { ReactNode } from "react";
import type { HoverCardProps } from "../../src/web/HoverCard";

/**
 * Double de test de `HoverCard` pour les specs en rendu statique (`renderToStaticMarkup`) : pas de portail ni de survol, le contenu de
 * la carte est posé juste après le déclencheur, dans un <template data-hc-card> (une spec qui ne veut voir QUE la pastille le retire
 * avec `triggerOnly`). Repris de entity/__tests__/inline-hover-card.tsx de CLP ; le comportement réel est testé dans hover-card.test.tsx.
 */
export function HoverCard({ content, children, disabled }: HoverCardProps): ReactNode {
  return <>{typeof children === "function" ? children(false) : children}{disabled ? null : <template data-hc-card="">{content}</template>}</>;
}

/** Le HTML sans le contenu des cartes : ce que la pastille montre seule, avant le survol. */
export const triggerOnly = (markup: string): string => markup.replace(/<template data-hc-card="">[\s\S]*?<\/template>/g, "");
