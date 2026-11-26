// Numéro en clair, réservé par rôle (web/src/admin/lib/phone-reveal.ts de Chez la Petite). Règle « zéro numéro en clair » : au survol, SEUL le superadmin voit le
// numéro ; les autres rôles ne déclenchent JAMAIS d'appel de révélation pour « voir ». Le serveur journalise chaque lecture (qui, quel profil, jamais le numéro).
// Rien n'est chargé à l'avance : un appel par survol, gardé 30 s en mémoire (jamais en stockage local : le transport ne copie pas un POST).
// Le transport réseau est injecté (CLP : `adminFetch`, qui affiche l'échec) ; le chemin est celui de CLP par défaut et se remplace (`buildUrl`).
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { formatPhoneGrouped } from "./phone-grouping";
import { canRevealPhone, phoneRank, type AdminRolesInterface, type PhoneRankType, type PhoneRevealPurposeType } from "./phone-rank";

const CACHE_MS = 30_000;

/** Envoie la requête ; `null` si elle a échoué (le transport l'a déjà signalé). `handleStatuses` : statuts rendus à l'appelant au lieu d'être signalés. */
export type PhoneRevealTransport = (label: string, url: string, init: { method: "POST"; handleStatuses?: number[] }) => Promise<Response | null>;

/** Le serveur refuse : aucun accès temporaire en cours pour cette action sur ce profil. */
export class PhoneAccessRequired extends Error { constructor() { super("access_required"); } }

export interface PhoneRevealOptions {
  transport: PhoneRevealTransport;
  /** Défaut : `/api/support/profiles/<id>/phone-reveal` + `?identifier=` ou `?purpose=` (chemin de CLP). */
  buildUrl?: (profileId: string, query: string) => string;
}

export interface PhoneReveal {
  /** Appelé à la connexion : le rôle du lecteur conditionne la révélation. */
  setViewer: (admin: AdminRolesInterface | null | undefined) => void;
  viewerPhoneRank: () => PhoneRankType;
  useViewerPhoneRank: () => PhoneRankType;
  useViewerIsSuperadmin: () => boolean;
  /** Le numéro lisible (« +237 690 00 00 11 »), ou `null` si refusé ou introuvable. Aucun appel hors superadmin. */
  revealPhone: (profileId: string, identifierId?: string | null, now?: () => number) => Promise<string | null>;
  /** Le numéro en clair (E.164) pour UNE action (appeler, copier, révéler) : jamais en cache, chaque action est journalisée. Jamais écrit dans le DOM ni dans une URL. */
  fetchPhoneFor: (purpose: PhoneRevealPurposeType, profileId: string, identifierId?: string | null) => Promise<string | null>;
  clearRevealedPhones: () => void;
}

const defaultUrl = (profileId: string, query: string): string => `/api/support/profiles/${encodeURIComponent(profileId)}/phone-reveal${query ? `?${query}` : ""}`;

export function createPhoneReveal({ transport, buildUrl = defaultUrl }: PhoneRevealOptions): PhoneReveal {
  let rank: PhoneRankType = "other";
  let superadmin = false;
  const listeners = new Set<() => void>();
  const cache = new Map<string, { at: number; phone: string }>();
  const inflight = new Map<string, Promise<string | null>>();
  const subscribe = (l: () => void): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

  const setViewer: PhoneReveal["setViewer"] = (admin) => {
    const nextRank = phoneRank(admin);
    if (nextRank === rank) return;
    rank = nextRank;
    superadmin = nextRank === "superadmin";
    if (!superadmin) cache.clear();
    listeners.forEach((l) => l());
  };

  const revealPhone: PhoneReveal["revealPhone"] = async (profileId, identifierId, now = Date.now) => {
    if (!superadmin || !profileId) return null;
    const key = `${profileId}|${identifierId ?? ""}`;
    const hit = cache.get(key);
    if (hit && now() - hit.at < CACHE_MS) return hit.phone;
    const pending = inflight.get(key);
    if (pending) return pending;
    const query = identifierId ? `identifier=${encodeURIComponent(identifierId)}` : "";
    const run = (async () => {
      const r = await transport("Révéler le numéro", buildUrl(profileId, query), { method: "POST" });
      const body = r ? ((await r.json().catch(() => null)) as { phone?: unknown } | null) : null;
      const phone = typeof body?.phone === "string" ? formatPhoneGrouped(`+${body.phone.replace(/\D/g, "")}`) : "";
      if (!phone) return null;
      cache.set(key, { at: now(), phone });
      return phone;
    })().finally(() => inflight.delete(key));
    inflight.set(key, run);
    return run;
  };

  const fetchPhoneFor: PhoneReveal["fetchPhoneFor"] = async (purpose, profileId, identifierId) => {
    // Hors admin, appeler / copier part quand même : seul un accès temporaire accordé sur demande l'ouvre, et c'est le serveur qui le tranche.
    if (!profileId || !(canRevealPhone(rank, purpose) || (rank === "other" && purpose !== "view"))) return null;
    const params = new URLSearchParams({ purpose });
    if (identifierId) params.set("identifier", identifierId);
    const r = await transport("Révéler le numéro", buildUrl(profileId, params.toString()), { method: "POST", handleStatuses: [403] });
    if (r?.status === 403 && rank === "other") throw new PhoneAccessRequired(); // pas d'accès en cours (échu, retiré, jamais accordé) : l'appelant propose la demande
    const body = r ? ((await r.json().catch(() => null)) as { phone?: unknown } | null) : null;
    return typeof body?.phone === "string" && /^\+?\d{6,}$/.test(body.phone) ? body.phone : null;
  };

  return {
    setViewer, revealPhone, fetchPhoneFor,
    viewerPhoneRank: () => rank,
    useViewerPhoneRank: () => useSyncExternalStore(subscribe, () => rank, () => rank),
    useViewerIsSuperadmin: () => useSyncExternalStore(subscribe, () => superadmin, () => false),
    clearRevealedPhones: () => cache.clear(),
  };
}

/** Sans fournisseur : aucun transport, rang « autre » : rien ne se révèle, le numéro reste masqué. */
const NONE: PhoneReveal = createPhoneReveal({ transport: async () => null });

const PhoneRevealContext = createContext<PhoneReveal>(NONE);

export function PhoneRevealProvider({ value, children }: { value: PhoneReveal; children: ReactNode }) {
  return <PhoneRevealContext.Provider value={value}>{children}</PhoneRevealContext.Provider>;
}

export function usePhoneReveal(): PhoneReveal {
  return useContext(PhoneRevealContext);
}
