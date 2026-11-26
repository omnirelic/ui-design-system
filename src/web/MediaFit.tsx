// Photo plein cadre (web/src/ui/MediaFit.tsx de CLP) : recadrage intelligent du CDN (`g_auto`), remplit tout l'espace, sans bandes floutées ; filigrane optionnel cuit côté CDN ;
// repli sur un emoji de CONTENU (celui du plat ou de la catégorie, donnée saisie par l'admin) quand il n'y a pas d'image.
// Écarts : `watermark` est le filigrane lui-même (texte + couleur, CLP : « CHEZ LA PETITE » en dur) et non un booléen ; le fond de repli par défaut est le fond du thème (CLP : #111).
import { cdnUrlWatermarked, type Watermark } from "./image-urls";
import { BG } from "./theme";

export interface MediaFitProps {
  url: string | null | undefined;
  alt: string;
  w: number;
  h: number;
  /** Filigrane cuit dans l'image ; absent : aucune marque. */
  watermark?: Watermark;
  /** Emoji de contenu affiché sans image. */
  emoji?: string;
  bg?: string;
}

export function MediaFit({ url, alt, w, h, watermark, emoji, bg }: MediaFitProps) {
  const src = watermark ? cdnUrlWatermarked(url, w, h, watermark) : url;
  if (!src) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", background: bg ?? BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {emoji && <span style={{ fontSize: Math.min(w, h) * 0.35 }}>{emoji}</span>}
      </div>
    );
  }
  return (
    <img
      src={src} alt={alt} loading="lazy" decoding="async"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
