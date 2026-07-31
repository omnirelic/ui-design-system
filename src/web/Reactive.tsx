// Élément interactif avec vrais états hover/active/focus — un style inline
// React ne peut PAS exprimer :hover/:active/:focus-visible, donc tout
// bouton/lien construit avec juste `style={{}}` (comme LocationPage.tsx
// avant ce fichier) reste visuellement mort au survol. Même pattern que
// LogoMark.tsx : <style> scopé par instance via useId(), le package reste
// autonome (pas de classe globale à définir côté app consommatrice).
import { useId, type ElementType, type ComponentPropsWithoutRef, type ReactNode } from "react";

export type ReactiveVariant = "primary" | "ghost" | "icon" | "chip" | "card";

const VARIANT_CSS: Record<ReactiveVariant, (cls: string) => string> = {
  // Bouton plein (CTA) — lift + glow au survol, tassement au clic, léger
  // "souffle" (scale) au repos pour inciter au clic sans être criard —
  // s'arrête au survol/clic (l'interaction prend le relais) et respecte
  // prefers-reduced-motion (jamais imposée à qui la désactive).
  primary: (cls) => `
    @keyframes ${cls}-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    .${cls} {
      transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
      animation: ${cls}-breathe 2.4s ease-in-out infinite;
    }
    .${cls}:hover { filter: brightness(1.07); transform: translateY(-1px); animation-play-state: paused; }
    .${cls}:active { transform: translateY(0) scale(0.97); filter: brightness(0.95); animation-play-state: paused; }
    .${cls}:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .${cls} { animation: none; } }
  `,
  // Bouton contour/texte (PARTAGER) — remplissage léger au survol.
  ghost: (cls) => `
    .${cls} { transition: background 140ms ease, border-color 140ms ease, color 140ms ease; }
    .${cls}:hover { background: #5eead41a; border-color: #5eead488; color: #5eead4; }
    .${cls}:active { transform: scale(0.96); }
    .${cls}:focus-visible { outline: 2px solid #5eead4; outline-offset: 2px; }
  `,
  // Bouton rond icône seule (flèches galerie, partager mobile).
  icon: (cls) => `
    .${cls} { transition: background 140ms ease, color 140ms ease, transform 140ms ease; }
    .${cls}:hover { background: #ffffff14; color: #5eead4; }
    .${cls}:active { transform: scale(0.88); }
    .${cls}:focus-visible { outline: 2px solid #5eead4; outline-offset: 2px; }
  `,
  // Pastille/select custom (succursale, lieu de livraison) — éclaircit.
  chip: (cls) => `
    .${cls} { transition: filter 140ms ease, transform 140ms ease; }
    .${cls}:hover { filter: brightness(1.18); }
    .${cls}:active { transform: scale(0.98); }
    .${cls}:focus-within { outline: 2px solid #5eead4; outline-offset: 2px; }
  `,
  // Carte cliquable (lien carte/adresse) — léger soulèvement.
  card: (cls) => `
    .${cls} { transition: border-color 140ms ease, background 140ms ease, transform 140ms ease; }
    .${cls}:hover { border-color: #5eead488; background: #5eead40d; }
    .${cls}:active { transform: scale(0.99); }
    .${cls}:focus-visible { outline: 2px solid #5eead4; outline-offset: 2px; }
  `,
};

type ReactiveProps<T extends ElementType> = {
  as?: T;
  variant: ReactiveVariant;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function Reactive<T extends ElementType = "button">({ as, variant, className, children, ...rest }: ReactiveProps<T>) {
  const Tag = (as ?? "button") as ElementType;
  const gid = useId().replace(/:/g, "");
  const cls = `omni-reactive-${gid}`;
  return (
    <>
      <style>{VARIANT_CSS[variant](cls)}</style>
      <Tag className={[cls, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </Tag>
    </>
  );
}
