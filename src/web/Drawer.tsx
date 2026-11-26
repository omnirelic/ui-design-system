// Drawer de CLP (web/src/ui/Drawer.tsx) : panneau latéral qui glisse depuis la droite. En-tête (fil d'Ariane, titre, extra, ×),
// barre d'actions fixe, corps qui défile, pied fixe. Fermeture par ×, Échap ou clic sur le fond, avec animation de sortie (280 ms) avant démontage.
// Comme CLP : pas de piège de focus ni de rôle `dialog` (non ajoutés). Couleurs = jetons du thème ; titre dans la police d'affichage omnirelic (CLP : Cormorant Garamond).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { BG, BORDER, CARD, TXT, rem, MONO } from "./theme";
import { typography } from "../tokens";
import { Icon } from "./Icon";
import { ControlButton, SHADOW_DRAWER, VEIL, Z } from "./controls";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Fil d'Ariane (menu › onglet) au-dessus du titre : d'où l'on vient. */
  crumbs?: ReactNode;
  /** Largeur max du panneau (px). Le panneau ne dépasse jamais 100% de l'écran. */
  width?: number;
  /** Barre d'actions FIXE sous le titre (reste visible quand le corps défile). */
  actions?: ReactNode;
  children: ReactNode;
  /** Habillage d'une surface qui n'est pas l'admin : fond, filet, titre, marge du corps. */
  skin?: { background?: string; border?: string; title?: CSSProperties; bodyPadding?: string };
  /** Voile assombri derrière le panneau (défaut). `false` : aucun voile, le fond laisse passer les clics ; on ferme par ×, Échap ou l'action de la vue. */
  veil?: boolean;
  /** Avec `veil={false}` : un clic sur le fond (hors du panneau) ferme quand même le tiroir ; la vue derrière n'est plus utilisable tant qu'il est ouvert. */
  outsideClose?: boolean;
  /** À côté du × dans l'en-tête (ex. un menu ⋯). */
  headerExtra?: ReactNode;
  /** Sans barre de titre ni fil d'Ariane : le contenu commence tout en haut et un × flottant ferme. Le corps n'a plus de marge. */
  bare?: boolean;
  /** Le conteneur qui défile (parallaxe, en-tête réduit). */
  bodyRef?: Ref<HTMLDivElement>;
  /** Pied FIXE sous le corps (reste visible quand le corps défile) : total + action principale d'un formulaire. */
  footer?: ReactNode;
};

const SLIDE_MS = 280; // doit matcher la transition transform ci-dessous

export function Drawer({ open, onClose, title, crumbs, width = 560, actions, children, skin, veil = true, outsideClose = false, headerExtra, footer, bare, bodyRef }: DrawerProps) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  // mounted : présent dans le DOM (reste vrai le temps de l'anim de sortie). visible : pilote le sens de l'animation.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // rAF : on monte d'abord hors-écran, puis on bascule visible → slide-in.
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), SLIDE_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;
  const border = skin?.border ?? BORDER;
  const background = skin?.background ?? CARD;

  return (
    <div
      data-drawer-overlay
      onClick={veil || outsideClose ? onClose : undefined}
      style={{
        position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: veil ? VEIL : "transparent", zIndex: Z.drawer,
        display: "flex", justifyContent: "flex-end", fontFamily: MONO,
        opacity: visible ? 1 : 0, transition: "opacity 0.22s ease",
        ...(veil || outsideClose ? {} : { pointerEvents: "none" }),
      }}
    >
      <div
        data-drawer-panel
        onClick={(e) => e.stopPropagation()}
        style={{
          ...(veil ? {} : { pointerEvents: "auto" }),
          width: `min(${width}px, 100%)`, height: "100%", background, borderLeft: `1px solid ${border}`,
          display: "flex", flexDirection: "column", position: "relative", boxShadow: SHADOW_DRAWER,
          transform: visible ? "translateX(0)" : "translateX(100%)", transition: `transform ${SLIDE_MS}ms cubic-bezier(0.16,1,0.3,1)`, willChange: "transform",
        }}
      >
        {bare ? (
          <ControlButton variant="bare" size="raw" onClick={onClose} aria-label="Fermer" title="Fermer"
            style={{ position: "absolute", top: 14, right: 16, zIndex: Z.sticky * 2, fontSize: 22, padding: rem(7), borderRadius: rem(10), background: `color-mix(in srgb, ${BG} 55%, transparent)`, backdropFilter: "blur(6px)", border: `1px solid ${border}` }}>
            <Icon name="action-close" size="1em" weight="bold" />
          </ControlButton>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: rem(16), padding: `${rem(20)} ${rem(28)}`, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: rem(6) }}>
              {crumbs}
              <div style={{ fontSize: 20, color: TXT, fontFamily: `${typography.fontDisplay}, sans-serif`, fontWeight: 300, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...skin?.title }}>{title}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: rem(8), flexShrink: 0 }}>
              {headerExtra}
              <ControlButton variant="bare" size="raw" onClick={onClose} aria-label="Fermer" title="Fermer" style={{ fontSize: 24, flexShrink: 0 }}><Icon name="action-close" size="1em" weight="bold" /></ControlButton>
            </div>
          </div>
        )}
        {actions && <div className="omni-drawer-actions" style={{ display: "flex", gap: rem(12), padding: `${rem(12)} ${rem(28)}`, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>{actions}</div>}
        <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: bare ? 0 : skin?.bodyPadding ?? "24px 28px 32px" }}>{children}</div>
        {footer && <div data-drawer-footer style={{ flexShrink: 0, padding: `${rem(14)} ${rem(28)}`, borderTop: `1px solid ${border}`, background }}>{footer}</div>}
      </div>
    </div>
  );
}
