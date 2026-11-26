// Carte au survol (ou au focus clavier) d'une pastille d'entité : web/src/admin/ui/entity/HoverCard.tsx de CLP, tel quel. Socle UNIQUE du menu d'actions des pastilles et des fiches rapides.
// Floating UI place la carte (dessous, sinon dessus ; recalée sur les bords ; hauteur bornée) et la rend dans un portail du <body> au niveau `Z_CARD` :
// un conteneur qui défile ou une carte voisine ne la coupe ni ne la recouvre, et elle passe au-dessus des tiroirs et des modales (mais sous les infobulles).
import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import {
  useFloating, useHover, useFocus, useDismiss, useRole, useInteractions,
  offset, flip, shift, size, autoUpdate, safePolygon, FloatingPortal,
} from "@floating-ui/react";

/** Niveau de la carte : au-dessus des tiroirs (1200) et des modales (1300), sous les infobulles (9999) — `Z.card` de CLP. */
export const Z_CARD = 1400;

export interface HoverCardProps {
  /** La carte : montée au premier survol seulement, démontée à la fermeture (listes et chiffres de l'entité ne se chargent pas avant). */
  content: ReactNode;
  /** Le déclencheur. En fonction : reçoit `open`, pour couper ses propres infobulles tant que la carte est ouverte. */
  children: ReactNode | ((open: boolean) => ReactNode);
  /** Rien à ouvrir : le déclencheur reste tel quel, sans survol ni focus. */
  disabled?: boolean;
  /** Sélecteur d'un ancêtre sur lequel la carte se place (ex. la ligne client entière) plutôt que sur le déclencheur. */
  anchor?: string;
  /** Nom du dialogue (lecteur d'écran). */
  label?: string;
  className?: string;
  tabIndex?: number;
  /** Un clic sur le déclencheur ne remonte pas (pastille posée dans une carte cliquable). La carte, elle, ne remonte jamais. */
  stopClicks?: boolean;
  delay?: { open: number; close: number };
  /** Sélecteur d'un ancêtre dont la carte ne sort pas : elle se replace, se borne en largeur et en hauteur dans ses bords. */
  contain?: string;
  /** Côté préféré (dessous, alignée à gauche, par défaut). */
  placement?: "bottom-start" | "bottom-end";
}

const DEFAULT_DELAY = { open: 120, close: 80 };
const VIEWPORT_PADDING = 8;
const MIN_HEIGHT_PX = 120;

export function HoverCard({ content, children, disabled, anchor, label, className, tabIndex, stopClicks, delay = DEFAULT_DELAY, contain, placement = "bottom-start" }: HoverCardProps) {
  const [open, setOpen] = useState(false);
  const [boundary, setBoundary] = useState<Element | undefined>(undefined);
  const { refs, floatingStyles, context } = useFloating({
    open: open && !disabled,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: VIEWPORT_PADDING, boundary }),
      shift({ padding: VIEWPORT_PADDING, boundary, crossAxis: !!boundary }),
      size({
        padding: VIEWPORT_PADDING, boundary,
        apply({ availableHeight, availableWidth, elements }) {
          elements.floating.style.maxHeight = `${Math.max(MIN_HEIGHT_PX, availableHeight)}px`;
          if (boundary) elements.floating.style.maxWidth = `${Math.max(0, availableWidth)}px`;
        },
      }),
    ],
  });
  const enabled = !disabled;
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { enabled, move: false, delay, handleClose: safePolygon() }),
    useFocus(context, { enabled }),
    useDismiss(context, { enabled }),
    useRole(context, { enabled, role: "dialog" }),
  ]);

  // Contenue dans un ancêtre : il est connu une fois le déclencheur monté, donc à l'ouverture.
  useEffect(() => {
    if (!open || !contain) return;
    setBoundary(refs.domReference.current?.closest(contain) ?? undefined);
  }, [open, contain, refs]);

  // La carte se place sur l'ancêtre désigné : il est connu une fois le déclencheur monté, donc à l'ouverture.
  useEffect(() => {
    if (!open || !anchor) return;
    const el = refs.domReference.current?.closest(anchor);
    if (el) refs.setPositionReference(el);
  }, [open, anchor, refs]);

  const reference: HTMLAttributes<HTMLElement> = getReferenceProps(stopClicks ? { onClick: e => e.stopPropagation() } : undefined);
  const visible = open && enabled;
  return (
    <>
      <span ref={refs.setReference} {...reference} data-hover-card="" data-open={visible ? "" : undefined} className={className} tabIndex={tabIndex}>
        {typeof children === "function" ? children(visible) : children}
      </span>
      {visible && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps({ onClick: e => e.stopPropagation() })}
            data-hover-card-panel=""
            aria-label={label}
            style={{ ...floatingStyles, zIndex: Z_CARD, overflowY: "auto" }}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
