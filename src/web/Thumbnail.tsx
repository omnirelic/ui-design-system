// Vignette unique de l'admin (web/src/ui/Thumbnail.tsx de CLP : plats, catégories, options) : l'image transformée par `cdnUrl` (2× la taille) si présente,
// sinon un cadre neutre avec un pictogramme image ; bascule sur le cadre si l'image échoue à charger.
import { useState, type CSSProperties } from "react";
import { cdnUrl } from "./image-urls";
import { BG2, BORDER, DIM } from "./theme";

export interface ThumbnailProps {
  src?: string | null;
  size?: number;
  alt?: string;
  radius?: number;
  style?: CSSProperties;
}

export function Thumbnail({ src, size = 40, alt = "", radius = 8, style }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const url = !failed ? cdnUrl(src, size * 2, size * 2) : null;

  const box: CSSProperties = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    objectFit: "cover", display: "block", ...style,
  };

  if (url) {
    return <img src={url} alt={alt} loading="lazy" decoding="async" style={box} onError={() => setFailed(true)} />;
  }

  return (
    <div
      aria-label="Aucune image"
      style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center", background: BG2, border: `1px solid ${BORDER}`, boxSizing: "border-box" }}
    >
      <svg width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} viewBox="0 0 24 24"
        fill="none" stroke={DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}
