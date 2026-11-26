// Une photo ou un libellé qui agrandit l'image sur place par le visualiseur, jamais dans un nouvel onglet (web/src/admin/ui/PhotoLink.tsx de CLP) : une galerie d'une seule photo.
import type { ReactNode } from "react";
import { ImageGallery } from "./ImageGallery";
import { useOpenImage } from "./gallery-context";

function Trigger({ url, label, children }: { url: string; label?: string; children: ReactNode }) {
  const open = useOpenImage();
  return (
    <button type="button" aria-label={label ?? "Agrandir la photo"} onClick={(e) => open?.(url, e.currentTarget)}
      style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "zoom-in", display: "inline-flex", color: "inherit", textDecoration: "inherit" }}>
      {children}
    </button>
  );
}

export function PhotoLink({ url, label, children }: { url: string; label?: string; children: ReactNode }) {
  return (
    <ImageGallery images={[{ id: url, url }]}>
      <Trigger url={url} label={label}>{children}</Trigger>
    </ImageGallery>
  );
}
