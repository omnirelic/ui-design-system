// Une adresse de livraison en pastille : lieu | distance | frais | durée estimée (web/src/admin/ui/entity/AddressRef.tsx de Chez la Petite). Distance routière du devis de
// livraison. Pendant le calcul : le lieu seul et des points ; hors zone : le badge « Hors zone » en rouge, sans frais ; sans devis possible (indications seules, serveur
// injoignable) : le lieu seul — jamais un frais ou une durée inventés. Le devis vient du branchement de l'application (`AddressQuoteProvider`) : CLP interroge OSRM
// par coordonnées ou son engine par quartier ; sans fournisseur, jamais de devis.
import { createContext, useContext, type ReactNode } from "react";
import { LeadDisc } from "./LeadDisc";
import { PastilleCapsule } from "./PastilleCapsule";
import { arrangeSegments, type Qualifier } from "./capsule-model";
import { orderPlaceText } from "./place-text";

/** Adresse enregistrée d'un client : un lieu (GPS OU quartier du paiement) + indications. */
export interface DefaultAddress { lat?: number; lng?: number; neighborhoodId?: string; label?: string; instructions?: string }

/** De quoi demander le devis : un point GPS, sinon un quartier ; `null` (indications seules) = pas de devis possible. */
export type AddressQuoteTarget = { lat: number; lng: number } | { neighborhoodId: string } | null;
export interface RoadQuote { fee: number; distanceKm: number; etaMin: number; outOfRange: boolean }
export type UseRoadQuote = (target: AddressQuoteTarget) => { quote: RoadQuote | null; loading: boolean };

const NO_QUOTE: UseRoadQuote = () => ({ quote: null, loading: false });
const AddressQuoteContext = createContext<UseRoadQuote>(NO_QUOTE);

/** Branche le devis de livraison (un hook, appelé à chaque rendu : rendre toujours le même). */
export function AddressQuoteProvider({ useRoadQuote, children }: { useRoadQuote: UseRoadQuote; children: ReactNode }) {
  return <AddressQuoteContext.Provider value={useRoadQuote}>{children}</AddressQuoteContext.Provider>;
}

export function quoteTarget(a: DefaultAddress): AddressQuoteTarget {
  if (Number.isFinite(a.lat) && Number.isFinite(a.lng)) return { lat: a.lat as number, lng: a.lng as number };
  return a.neighborhoodId ? { neighborhoodId: a.neighborhoodId } : null;
}

/** « 3,4 km », « 16 km », « < 0,1 km ». */
export function formatKm(km: number): string {
  if (km < 0.1) return "< 0,1 km";
  const rounded = Math.round(km * 10) / 10;
  return `${String(rounded).replace(".", ",")} km`;
}

/** Le badge d'une adresse hors de la zone de livraison (`QUALIFIERS.outOfZone` de CLP). */
export const OUT_OF_ZONE: Qualifier = { label: "Hors zone", icon: "status-warning", tone: "red" };

export interface AddressRefProps {
  address: DefaultAddress;
  /** Adresse par défaut du client : étoile au lieu de l'épingle. */
  isDefault?: boolean;
  /** Frais figé d'une commande : il l'emporte sur le devis du jour (distance et durée restent ceux du devis). */
  fee?: number | null;
}

export function AddressRef({ address, isDefault, fee }: AddressRefProps) {
  const target = quoteTarget(address);
  const { quote, loading } = useContext(AddressQuoteContext)(target);
  const place = orderPlaceText(address.label, null) || (target ? "Adresse" : "Indications");
  const out = !!quote?.outOfRange;
  const segments = arrangeSegments([
    { role: "label", text: place, strong: true },
    { role: "value", text: loading ? "···" : quote ? formatKm(quote.distanceKm) : null, tone: out ? "bad" : "muted" },
    { role: "value", money: fee && fee > 0 ? fee : quote && !out ? quote.fee : null },
    { role: "when", text: quote && !out && quote.etaMin > 0 ? `≈ ${quote.etaMin} min` : null },
  ]);
  const lead = <LeadDisc lead={{ kind: "icon", icon: isDefault ? "ui-star" : "action-location" }} label={isDefault ? "Adresse par défaut" : undefined} />;
  // Les indications (« devant la pharmacie ») ne sont écrites nulle part ailleurs : c'est l'information de l'infobulle.
  return <span title={address.instructions?.trim() || undefined}><PastilleCapsule lead={lead} segments={segments} qualifier={out ? OUT_OF_ZONE : undefined} /></span>;
}
