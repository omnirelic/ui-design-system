// Infobulle positionnée par Floating UI (web/src/ui/Tooltip.tsx de Chez la Petite) : dessus par défaut, bascule et recale sur les bords, flèche, clavier et tap mobile
// (focus + fermeture). `trigger` : « hover » (+ focus clavier), « click », ou « manual » (l'appelant pilote `open`/`onOpenChange`). `skip` : évalué à l'ouverture,
// vrai = la bulle n'apporte rien, on ne l'affiche pas. Règle de CLP : une infobulle explique une chose non évidente, jamais l'écho d'un libellé.
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useFloating, useHover, useFocus, useClick, useDismiss, useRole, useInteractions, offset, flip, shift, arrow, autoUpdate, FloatingArrow, FloatingPortal } from "@floating-ui/react";
import { BORDER, CARD, FONT, MONO, TXT } from "./theme";

type Placement = "top" | "bottom" | "left" | "right";

/** Niveau des infobulles : au-dessus des cartes (1400) et de tout le reste, comme `Z.tooltip` de CLP. */
export const Z_TOOLTIP = 9999;

export interface FloatingTooltipProps {
  content: ReactNode;
  placement?: Placement;
  children: ReactNode;
  style?: CSSProperties;
  trigger?: "hover" | "click" | "manual";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  skip?: () => boolean;
}

export function FloatingTooltip({ content, placement = "top", children, style, trigger = "hover", open: openProp, onOpenChange, skip }: FloatingTooltipProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const arrowRef = useRef<SVGSVGElement>(null);
  const { refs, floatingStyles, context } = useFloating({
    open, onOpenChange: setOpen, placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { move: false, enabled: trigger === "hover" }),
    useFocus(context, { enabled: trigger === "hover" }),
    useClick(context, { enabled: trigger === "click" }),
    useDismiss(context),
    useRole(context, { role: "tooltip" }),
  ]);
  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} style={{ display: "inline-flex", ...style }}>{children}</div>
      {open && !skip?.() && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles, zIndex: Z_TOOLTIP,
              // Surface surélevée (et non le fond de page) : sinon la bulle se confond avec le fond et devient illisible.
              background: CARD, color: TXT, border: `1px solid ${BORDER}`, boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
              padding: "9px 13px", borderRadius: 10, fontSize: FONT.base, fontFamily: MONO, letterSpacing: 0.2, lineHeight: 1.5, maxWidth: 300, whiteSpace: "pre-line", pointerEvents: "none",
            }}
          >
            {content}
            <FloatingArrow ref={arrowRef} context={context} fill={CARD} width={12} height={6} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
