// Contrôle d'une capture de paiement avant l'envoi (web/src/tracking/proof-file.ts de CLP) : type image, taille bornée.
// Message d'erreur, ou null si valide.
export const MAX_PROOF_BYTES = 10 * 1024 * 1024;

export function checkProofFile(file: Pick<File, "type" | "size">): string | null {
  if (!file.type.startsWith("image/") || file.size <= 0) return "Choisissez une image.";
  if (file.size > MAX_PROOF_BYTES) return "Image trop lourde (10 Mo max).";
  return null;
}
