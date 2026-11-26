// Téléversement d'une photo de preuve (web/src/admin/lib/use-proof-upload.ts de CLP) : url courante, envoi en cours, message d'échec.
// Le transport est injecté (`upload`, URL ou `null` en cas d'échec : `createCloudinaryUploader(...).image`) ; CLP appelait `uploadProofImage` en dur.
import { useState } from "react";

export function useProofUpload(upload: (file: File) => Promise<string | null>, initialUrl: string | null = null) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function pick(file: File | undefined) {
    if (!file) return;
    setUploading(true); setError("");
    const uploaded = await upload(file);
    setUploading(false);
    if (uploaded) setUrl(uploaded); else setError("Échec de l'envoi de la photo — réessayez.");
  }
  return { url, uploading, error, pick, reset: () => { setUrl(initialUrl); setError(""); }, clear: () => { setUrl(null); setError(""); } };
}
