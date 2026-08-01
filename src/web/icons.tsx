// Icônes sobres (trait, 1.75px, 24x24) pour remplacer les emoji dans les
// vues publiques — un emoji rend différemment selon OS/police (Apple vs
// Android vs Windows), jamais garanti visuellement cohérent avec le reste
// du design system. Même esprit que lucide/heroicons mais dessinées à la
// main pour rester sans dépendance externe (voir tokens.ts — omnirelic ne
// tire jamais un package juste pour une poignée de tracés).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconKey(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.5 12.5 20 3M17 6l3 3M14 9l2.5 2.5" />
    </Svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.5" y="7" width="13" height="9" rx="1" />
      <path d="M14.5 10h3.5l3 3v3h-6.5z" />
      <circle cx="6" cy="18" r="1.75" />
      <circle cx="17.5" cy="18" r="1.75" />
    </Svg>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5z" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
    </Svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </Svg>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4h3.2l1.4 4.2-2 1.6a12 12 0 0 0 6.6 6.6l1.6-2 4.2 1.4V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4z" />
    </Svg>
  );
}

// ── Icônes de service (MACRO_SERVICE_CTA — capabilities.ts) ────────────────
// Un CTA par GlobalService actif sur un lieu, jamais un unique bouton
// générique — voir capabilities.ts. Mêmes emoji remplacés par les mêmes
// traits que le reste de la page pour rester visuellement cohérent.

export function IconFood(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 8v3a1.5 1.5 0 0 0 3 0V8M9.5 11v5M16 8v9M14.5 8c0 1.7 1.5 2 1.5 3.5V8" />
    </Svg>
  );
}

export function IconPrinter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 8V4h12v4" />
      <rect x="4" y="8" width="16" height="8" rx="1.5" />
      <path d="M7 14h10v6H7z" />
    </Svg>
  );
}

export function IconLaundry(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3" width="17" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M9.5 13a2.5 2.5 0 0 0 5 0M6.5 6h.01M9.5 6h.01" />
    </Svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 4h2l2.2 11h10.6L20 8H7.2" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </Svg>
  );
}

export function IconPackage(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4 7v10l8 4 8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </Svg>
  );
}

export function IconBroom(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 4 10 14" />
      <path d="M9 13 4 20l3-1 1.5 1.5L10 19l-1-3z" />
      <path d="M13 11l3.5 3.5" />
    </Svg>
  );
}

// Remplace le glyphe texte "▼" (rendu incohérent selon police) dans les
// sélecteurs custom des vues publiques.
export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={2.25}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}
