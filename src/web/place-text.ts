// Où va une commande, écrit une seule fois (admin/lib/order-place.ts de Chez la Petite) : le libellé de l'adresse enregistrée sans le préfixe du paiement
// « Ma localisation: », plus le quartier de la commande seulement s'il apporte quelque chose (pas le même lieu, pas déjà contenu dans le libellé).
const LOCATION_PREFIX = "Ma localisation: ";

const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Le quartier seul d'un libellé d'adresse enregistré, sans le préfixe « Ma localisation: ». */
export function neighborhoodFromAddressLabel(addressLabel: string | null | undefined): string | null {
  if (!addressLabel) return null;
  return addressLabel.startsWith(LOCATION_PREFIX) ? addressLabel.slice(LOCATION_PREFIX.length) || null : addressLabel;
}

export function orderPlaceText(addressLabel: string | null | undefined, quartier: string | null | undefined): string {
  const label = neighborhoodFromAddressLabel(addressLabel?.trim()) ?? "";
  const q = quartier?.trim() ?? "";
  if (!q) return label;
  if (!label || norm(label).includes(norm(q))) return label || q;
  if (norm(q).includes(norm(label))) return q;
  return `${label} — ${q}`;
}

/** Titre de la ligne dans le détail d'une commande : un quartier choisi au paiement est un « Quartier », tout le reste une « Adresse ». */
export function orderPlaceRowLabel(addressLabel: string | null | undefined): "Quartier" | "Adresse" {
  return addressLabel?.startsWith(LOCATION_PREFIX) ? "Quartier" : "Adresse";
}
