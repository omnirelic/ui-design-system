// Réduction d'une photo avant l'envoi (web/src/admin/lib/cloudinary.ts `compressImage` et web/src/chat/chat-image.ts de CLP) : côté navigateur, canevas.
// `scaledSize` est la formule commune, extraite pour être testée sans canevas.

/** Taille réduite pour que le grand côté ne dépasse pas `maxPx` (jamais agrandie), arrondie au pixel. */
export function scaledSize(width: number, height: number, maxPx: number): { width: number; height: number } {
  const scale = Math.min(1, maxPx / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Nom du fichier réduit : l'extension devient `.jpg` ou `.png`. */
export const compressedName = (name: string, asJpeg: boolean): string => name.replace(/\.[^.]+$/, asJpeg ? ".jpg" : ".png");

/** Réduit une image (grand côté `maxPx`) en JPEG (fond noir, `quality`) ou PNG. SVG et GIF passent tels quels. Rejette si l'image est illisible. */
export async function compressImage(file: File, maxPx: number, quality: number, asJpeg: boolean): Promise<File> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const { width: w, height: h } = scaledSize(img.width, img.height, maxPx);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      if (asJpeg) { ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      const mime = asJpeg ? "image/jpeg" : "image/png";
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("canvas toBlob failed")); return; }
        resolve(new File([blob], compressedName(file.name, asJpeg), { type: mime }));
      }, mime, quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("Image load failed")); };
    img.src = objUrl;
  });
}

const CHAT_MAX_SIDE = 1600;

/** Une photo choisie réduite en JPEG (grand côté 1600 px, qualité 0,82) en base64 : une photo de téléphone pèse plusieurs Mo, le moteur en accepte 4. */
export async function photoToJpegBase64(file: Blob): Promise<{ dataBase64: string; mimeType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = scaledSize(bitmap.width, bitmap.height, CHAT_MAX_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const url = canvas.toDataURL("image/jpeg", 0.82);
  return { dataBase64: url.slice(url.indexOf(",") + 1), mimeType: "image/jpeg" };
}

/** Taille en pixels d'une photo choisie, ou `null` si elle est illisible. */
export async function photoSize(file: Blob): Promise<{ width: number; height: number } | null> {
  try { const b = await createImageBitmap(file); const out = { width: b.width, height: b.height }; b.close?.(); return out; } catch { return null; }
}
