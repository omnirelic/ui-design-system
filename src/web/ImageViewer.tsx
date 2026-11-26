// Visualiseur plein écran d'une galerie de photos (web/src/admin/ui/ImageViewer.tsx de CLP) : zoom (1, 1,5, 2, 3 ; clic sur l'image ; touches + - 0), navigation (boutons, flèches,
// balayage tactile de 50 px), précharge des voisines, téléchargement de l'original, focus piégé et rendu à la vignette, Échap, chargement (squelette) et erreur (« Photo indisponible »).
// Écarts : la couche plein écran de `Modal fullscreen` de CLP est intégrée ici (le `Modal` du paquet n'a pas ce mode) ; les boutons icône portent `title` + `aria-label` (infobulle d'icône seule).
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type TouchEvent } from "react";
import { Icon } from "./Icon";
import { ControlButton, Z } from "./controls";
import { Sk } from "./Skeleton";
import { RefText } from "./entity-text";
import { MONO } from "./theme";
import { formatDateTime } from "./safe-date";
import { mediaDownloadUrl, mediaViewUrl, type GalleryImage } from "./image-urls";
import { VIEWER_BG, VIEWER_DIM, VIEWER_INK } from "./image-viewer-css";

const ZOOM_STEPS = [1, 1.5, 2, 3];
const SWIPE_MIN_PX = 50;
const FOCUSABLE = "button:not(:disabled), a[href], [tabindex='0']";

export interface ImageViewerProps {
  images: GalleryImage[];
  /** Photo ouverte ; absente ou inconnue (périmée) : le visualiseur reste fermé, sans erreur. */
  currentId: string | null;
  onChange: (id: string) => void;
  onClose: () => void;
  /** Élément qui reprend le focus à la fermeture (la vignette cliquée). */
  restoreFocusTo?: () => HTMLElement | null;
}

function triggerDownload(href: string) {
  const a = document.createElement("a");
  a.href = href; a.rel = "noopener"; a.target = "_blank"; a.setAttribute("download", "");
  document.body.appendChild(a); a.click(); a.remove();
}

const iconButton = (label: string, name: Parameters<typeof Icon>[0]["name"], size: number, onClick: () => void, extra?: { disabled?: boolean; className?: string }) => (
  <ControlButton variant="ghost" title={label} aria-label={label} icon={<Icon name={name} size={size} />} onClick={onClick} disabled={extra?.disabled} className={extra?.className} />
);

function ViewerDialog({ images, index, onChange, onClose, restoreFocusTo }: Omit<ImageViewerProps, "currentId"> & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const image = images[index];
  const total = images.length;
  // Zoom et état de chargement appartiennent à UNE photo : changer de photo les remet à zéro sans effet de bord.
  const [zoomState, setZoomState] = useState({ id: image.id, value: 1 });
  const [loadState, setLoadState] = useState<{ id: string; state: "ready" | "error" } | null>(null);
  const zoom = zoomState.id === image.id ? zoomState.value : 1;
  const status = loadState?.id === image.id ? loadState.state : "loading";
  const setZoom = useCallback((value: number) => setZoomState({ id: image.id, value }), [image.id]);
  const stepZoom = useCallback((dir: 1 | -1) => {
    const at = ZOOM_STEPS.indexOf(zoom);
    setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, at + dir))]);
  }, [zoom, setZoom]);
  const go = useCallback((delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < total) onChange(images[next].id);
  }, [index, total, images, onChange]);

  // Focus : dans le visualiseur à l'ouverture, rendu à la vignette (ou à l'élément actif d'avant) à la fermeture.
  useEffect(() => {
    const back = restoreFocusTo?.() ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    ref.current?.focus();
    return () => { if (back?.isConnected) back.focus(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") stepZoom(1);
      else if (e.key === "-" || e.key === "_") stepZoom(-1);
      else if (e.key === "0") setZoom(1);
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, stepZoom, setZoom]);

  // Photos voisines : chargées d'avance pour que « suivante » soit instantané.
  useEffect(() => {
    for (const n of [index - 1, index + 1]) if (images[n]) new Image().src = mediaViewUrl(images[n].url);
  }, [index, images]);

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) { e.preventDefault(); ref.current.focus(); return; }
    const first = items[0]; const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; touch.current = t ? { x: t.clientX, y: t.clientY } : null; };
  const onTouchEnd = (e: TouchEvent) => {
    const from = touch.current; const t = e.changedTouches[0];
    touch.current = null;
    if (!from || !t || zoom !== 1) return;
    const dx = t.clientX - from.x; const dy = t.clientY - from.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const caption = image.caption?.trim() || "";
  const date = image.at ? formatDateTime(image.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }, "") : "";
  const counter = total > 1 ? `${index + 1} / ${total}` : "";

  return (
    <div ref={ref} className="ivw" role="dialog" aria-modal="true" aria-label={caption ? `Photo : ${caption}` : "Visualiseur de photos"} tabIndex={-1} onKeyDown={trapTab}>
      <div className="ivw-bar">
        <div className="ivw-title">
          <RefText variant="small" strong truncate color={VIEWER_INK}>{caption || "Photo"}</RefText>
          {(counter || date) && <RefText variant="caption" color={VIEWER_DIM}>{[counter, date].filter(Boolean).join(" · ")}</RefText>}
        </div>
        <div className="ivw-acts">
          {iconButton("Zoom arrière", "action-zoom-out", 18, () => stepZoom(-1), { disabled: zoom === ZOOM_STEPS[0] })}
          {iconButton("Zoom avant", "action-zoom-in", 18, () => stepZoom(1), { disabled: zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1] })}
          {iconButton("Ajuster à l'écran", "action-exit-fullscreen", 18, () => setZoom(1), { disabled: zoom === 1 })}
          {iconButton("Télécharger", "action-download", 18, () => triggerDownload(mediaDownloadUrl(image.url)))}
          {iconButton("Ouvrir l'original", "action-external", 18, () => window.open(image.url, "_blank", "noopener,noreferrer"))}
          {iconButton("Fermer", "action-close", 18, onClose)}
        </div>
      </div>

      <div className="ivw-stage" data-zoom={String(zoom)} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {status === "loading" && <div className="ivw-loading" aria-busy="true"><Sk w="min(70%, 32rem)" h={320} r={12} /></div>}
        {status === "error" ? (
          <div className="ivw-error">
            <Icon name="ui-image" size={30} />
            <RefText variant="small" color={VIEWER_DIM}>Photo indisponible</RefText>
            <a className="ivw-fallback" href={image.url} target="_blank" rel="noopener noreferrer">Ouvrir l'original</a>
          </div>
        ) : (
          <img
            key={image.id} className={`ivw-img${status === "loading" ? " ivw-img--pending" : ""}`} src={mediaViewUrl(image.url)} alt={caption || "Photo reçue"} draggable={false}
            style={zoom === 1 ? undefined : { width: `${zoom * 100}%`, maxWidth: "none", maxHeight: "none" }}
            onLoad={() => setLoadState({ id: image.id, state: "ready" })} onError={() => setLoadState({ id: image.id, state: "error" })}
            onClick={(e) => { e.stopPropagation(); setZoom(zoom === 1 ? 2 : 1); }}
          />
        )}
        {total > 1 && (
          <>
            {iconButton("Photo précédente", "ui-chevron-left", 24, () => go(-1), { disabled: index === 0, className: "ivw-nav ivw-nav--prev" })}
            {iconButton("Photo suivante", "ui-chevron-right", 24, () => go(1), { disabled: index === total - 1, className: "ivw-nav ivw-nav--next" })}
          </>
        )}
      </div>
    </div>
  );
}

/** Visualiseur plein écran d'une galerie de photos : zoom, navigation (boutons, clavier, balayage), téléchargement. */
export function ImageViewer({ images, currentId, onChange, onClose, restoreFocusTo }: ImageViewerProps) {
  const index = currentId ? images.findIndex((i) => i.id === currentId) : -1;
  const open = index >= 0;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: VIEWER_BG, zIndex: Z.modal, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO }} onClick={onClose}>
      <div style={{ background: "transparent", width: "100%", height: "100%", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <ViewerDialog images={images} index={index} onChange={onChange} onClose={onClose} restoreFocusTo={restoreFocusTo} />
      </div>
    </div>
  );
}
