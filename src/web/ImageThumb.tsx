// Vignette cliquable d'une photo (web/src/admin/ui/ImageThumb.tsx de CLP) : un vrai bouton (clavier, focus visible, survol) qui ouvre le visualiseur.
// Écart : le `title` en écho d'« Agrandir la photo » (déjà le nom accessible) est retiré, règle d'interface « aucun tooltip en écho d'un libellé ».
import "./image-viewer-css";

export interface ImageThumbProps {
  src: string;
  alt: string;
  /** Reçoit le bouton cliqué : le visualiseur lui rend le focus à la fermeture. */
  onOpen: (opener: HTMLElement) => void;
  className?: string;
}

export function ImageThumb({ src, alt, onOpen, className }: ImageThumbProps) {
  return (
    <button type="button" className={`ivw-thumb${className ? ` ${className}` : ""}`} aria-label="Agrandir la photo" onClick={(e) => onOpen(e.currentTarget)}>
      <img src={src} alt={alt} loading="lazy" />
    </button>
  );
}
