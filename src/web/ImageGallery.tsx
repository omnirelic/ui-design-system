// Galerie d'une vue, branchée sur le routeur (web/src/admin/ui/ImageGallery.tsx de CLP) : fournit `useOpenImage()` aux vignettes et monte le visualiseur piloté par `?photo=<id>`,
// donc partageable et rouvrable tel quel. Ouvrir ajoute une entrée d'historique (« Retour » ferme) ; changer de photo ou fermer remplacent l'entrée.
// Hors routeur (aperçu, test unitaire) : les enfants s'affichent tels quels, sans visualiseur. `react-router-dom` est une peerDependency optionnelle.
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { useInRouterContext, useSearchParams } from "react-router-dom";
import { withQueryParam } from "./state/query-params-core";
import { ImageViewer } from "./ImageViewer";
import { sortGallery, type GalleryImage } from "./image-urls";
import { OpenImageContext, type OpenImage } from "./gallery-context";

/** Paramètre d'URL de la photo ouverte (`?photo=<id>`). */
export const PHOTO_PARAM = "photo";

function RoutedGallery({ images, children }: { images: GalleryImage[]; children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const opener = useRef<HTMLElement | null>(null);
  const set = useCallback((id: string | null, replace: boolean) => setParams((prev) => withQueryParam(prev, PHOTO_PARAM, id), { replace }), [setParams]);
  const open = useCallback<OpenImage>((id, from) => { opener.current = from ?? null; set(id, false); }, [set]);
  const change = useCallback((id: string) => set(id, true), [set]);
  const close = useCallback(() => set(null, true), [set]);
  return (
    <OpenImageContext.Provider value={open}>
      {children}
      <ImageViewer images={images} currentId={params.get(PHOTO_PARAM)} onChange={change} onClose={close} restoreFocusTo={() => opener.current} />
    </OpenImageContext.Provider>
  );
}

export function ImageGallery({ images, children }: { images: GalleryImage[]; children: ReactNode }) {
  const inRouter = useInRouterContext();
  const sorted = useMemo(() => sortGallery(images), [images]);
  return inRouter ? <RoutedGallery images={sorted}>{children}</RoutedGallery> : <>{children}</>;
}
