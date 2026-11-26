// Miniature d'une photo choisie, avec croix de retrait optionnelle (`PhotoThumb` de web/src/admin/ui/Controls.tsx de CLP).
// Écart : le `title` « Retirer cette photo » en écho du nom accessible est retiré (règle d'interface).
import { Icon } from "./Icon";
import { BG, BORDER, TXT, rem } from "./theme";

export interface PhotoThumbProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  /** Côté en px (rem : suit la taille de police), 64 par défaut. */
  size?: number;
}

export function PhotoThumb({ src, alt, onRemove, size = 64 }: PhotoThumbProps) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <img src={src} alt={alt} style={{ width: rem(size), height: rem(size), objectFit: "cover", borderRadius: rem(8), border: `1px solid ${BORDER}`, display: "block" }} />
      {onRemove && (
        <button type="button" aria-label="Retirer cette photo" onClick={onRemove}
          style={{ position: "absolute", top: -6, right: -6, width: rem(20), height: rem(20), borderRadius: "50%", background: BG, border: `1px solid ${BORDER}`, color: TXT, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="action-close" size={10} weight="bold" />
        </button>
      )}
    </div>
  );
}
