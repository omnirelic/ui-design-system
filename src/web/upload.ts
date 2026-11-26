// Transport d'envoi des images et notes vocales. CLP lit `VITE_CLOUDINARY_*` en dur dans quatre fonctions (admin/lib/cloudinary.ts, lib/upload-image.ts, lib/photo-upload.ts,
// lib/voice-upload.ts) ; ici le cloud et le preset sont INJECTÉS (aucune clé, aucune adresse d'application dans le paquet) et les quatre se rejoignent.
// Les composants (`useProofUpload`, `VoiceTextInput`) ne connaissent qu'un `UploadTransport` : n'importe quel service qui rend une URL https convient.

/** Envoie un fichier, rend son URL publique, ou rejette avec une `UploadError`. */
export type UploadTransport = (file: Blob, opts?: { signal?: AbortSignal; onProgress?: (fraction: number) => void }) => Promise<string>;

export type UploadFailure = "not_configured" | "network" | "rejected" | "aborted";
export class UploadError extends Error {
  constructor(readonly code: UploadFailure) { super(code); this.name = "UploadError"; }
}

export interface CloudinaryConfig {
  cloudName?: string;
  /** Preset d'envoi non signé. */
  uploadPreset?: string;
}

const endpoint = (cloud: string, resource: "image" | "video") => `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/${resource}/upload`;

/**
 * Téléverse une image avec progression (0 à 1) et annulation (`signal`). Rend l'URL https ; rejette avec une `UploadError` sinon (jamais une URL vide).
 * Mêmes codes que CLP : `not_configured` (cloud ou preset absent), `aborted`, `network`, `rejected` (statut hors 2xx, réponse illisible, sans URL ou en http).
 */
export function uploadToCloudinaryWithProgress(file: Blob, opts: CloudinaryConfig & { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {}): Promise<string> {
  const { signal, onProgress, cloudName: cloud, uploadPreset: preset } = opts;
  return new Promise<string>((resolve, reject) => {
    if (!cloud || !preset) { reject(new UploadError("not_configured")); return; }
    if (signal?.aborted) { reject(new UploadError("aborted")); return; }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint(cloud, "image"));
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && e.total > 0) onProgress?.(Math.min(1, e.loaded / e.total)); };
    xhr.onload = () => {
      let url: unknown;
      try { url = (JSON.parse(xhr.responseText) as { secure_url?: unknown }).secure_url; } catch { /* réponse illisible */ }
      if (xhr.status >= 200 && xhr.status < 300 && typeof url === "string" && url.startsWith("https://")) resolve(url);
      else reject(new UploadError("rejected"));
    };
    xhr.onerror = () => reject(new UploadError("network"));
    xhr.onabort = () => reject(new UploadError("aborted"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    xhr.send(fd);
  });
}

/** Le transport Cloudinary avec progression, au contrat de `UploadTransport`. */
export function cloudinaryTransport(config: CloudinaryConfig): UploadTransport {
  return (file, opts) => uploadToCloudinaryWithProgress(file, { ...config, ...opts });
}

export interface CloudinaryUploader {
  /** Image (`File`) : URL publique, ou `null` en cas d'échec (aucune exception). */
  image: (file: Blob) => Promise<string | null>;
  /** Note vocale (`Blob`) : URL publique, ou `null` en cas d'échec. Le fichier part sous le nom `voice.webm`, par la ressource « video » de Cloudinary. */
  voice: (blob: Blob) => Promise<string | null>;
}

/** `uploadProofImage` / `uploadImage` et `uploadVoiceBlob` de CLP : requête simple (`fetch`), URL ou `null`. Sans cloud ni preset : `null`, sans requête. */
export function createCloudinaryUploader(config: CloudinaryConfig & { fetch?: typeof fetch }): CloudinaryUploader {
  const send = async (blob: Blob, resource: "image" | "video", name?: string): Promise<string | null> => {
    const { cloudName: cloud, uploadPreset: preset } = config;
    if (!cloud || !preset) return null;
    try {
      const fd = new FormData();
      if (name) fd.append("file", blob, name); else fd.append("file", blob);
      fd.append("upload_preset", preset);
      const r = await (config.fetch ?? fetch)(endpoint(cloud, resource), { method: "POST", body: fd });
      const d = await r.json();
      return typeof d?.secure_url === "string" ? d.secure_url : null;
    } catch {
      return null;
    }
  };
  return { image: (file) => send(file, "image"), voice: (blob) => send(blob, "video", "voice.webm") };
}
