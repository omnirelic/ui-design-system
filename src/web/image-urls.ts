// Adresses d'images (web/src/admin/ui/image-viewer-urls.ts et web/src/lib/cdn.ts de CLP) : version affichée, version téléchargée, ordre d'une galerie, vignette recadrée.
// Fonctions pures. Le service d'images supposé est Cloudinary (segment `/upload/`) ; toute autre adresse reste telle quelle.
// Écarts : `cdnUrlWatermarked` reçoit le filigrane (texte, couleur) au lieu de la marque de CLP en dur ; le cache disque de développement de CLP (`VITE_DEV_IMAGE_CACHE`) n'est pas repris.

export interface GalleryImage {
  id: string;
  /** URL https de l'image (déjà validée par l'appelant). */
  url: string;
  /** Légende : le texte joint à la photo. */
  caption?: string | null;
  /** Date d'envoi (ISO), pour l'ordre et l'en-tête. */
  at?: string | null;
}

const isCloudinary = (url: string) => url.includes("res.cloudinary.com") && url.includes("/upload/");

/** Version affichée : Cloudinary la sert large (1600 px au plus, sans recadrage) ; toute autre URL reste telle quelle. */
export function mediaViewUrl(url: string): string {
  return isCloudinary(url) ? url.replace("/upload/", "/upload/w_1600,c_limit,q_auto,f_auto/") : url;
}

/** Version téléchargée : l'original en pièce jointe (`fl_attachment`, l'attribut `download` est ignoré hors du domaine) ; autre URL : lien simple. */
export function mediaDownloadUrl(url: string): string {
  return isCloudinary(url) ? url.replace("/upload/", "/upload/fl_attachment/") : url;
}

/** Galerie dans l'ordre chronologique ; les images sans date gardent leur ordre d'origine (à la fin). */
export function sortGallery<T extends Pick<GalleryImage, "at">>(images: T[]): T[] {
  const time = (i: T) => { const t = i.at ? Date.parse(i.at) : NaN; return Number.isFinite(t) ? t : Infinity; };
  return images.map((image, index) => ({ image, index, t: time(image) }))
    .sort((a, b) => (a.t === b.t ? a.index - b.index : a.t < b.t ? -1 : 1))
    .map((x) => x.image);
}

/** Injecte taille, recadrage et qualité/format automatiques dans une URL Cloudinary ; autre URL telle quelle ; `null` si vide. */
export function cdnUrl(url: string | null | undefined, w: number, h: number): string | null {
  if (!url) return null;
  if (url.includes("res.cloudinary.com")) return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
  return url;
}

/** Filigrane texte cuit dans les pixels par le CDN (présent aussi sur un téléchargement direct). Taille et marges fixes, identiques sur toutes les photos. */
export interface Watermark {
  text: string;
  /** Couleur RVB du texte, 6 chiffres hexadécimaux sans `#` (paramètre `co_rgb` du CDN). */
  color: string;
}

/**
 * `cdnUrl` en recadrage intelligent (`g_auto`, plein cadre) + filigrane en bas à droite. Ordre des composants critique : recadrage d'ABORD, filigrane ENSUITE
 * (posé avant, il serait positionné sur l'original puis recadré hors champ).
 */
export function cdnUrlWatermarked(url: string | null | undefined, w: number, h: number, mark: Watermark): string | null {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  const text = encodeURIComponent(mark.text).replace(/%20/g, "%2520");
  const overlay = `l_text:Arial_20_bold:${text},co_rgb:${mark.color},o_85,g_south_east,x_14,y_50`;
  return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill,g_auto,q_auto,f_auto/${overlay}/`);
}
