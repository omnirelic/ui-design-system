// État et appel de la recherche par numéro d'une liste (web/src/admin/lib/phone-search.ts et ui/PhoneSearchNotice.tsx de Chez la Petite). Les listes ne portent
// qu'un numéro masqué : la comparaison se fait sur le SERVEUR, qui ne renvoie que les identifiants des lignes qui correspondent. Le terme part en POST (jamais dans
// l'URL) et la route n'est jamais mise en cache. Le transport est injecté (CLP : `adminFetch` + `/api/orders?view=phone_match`).
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { RefText } from "./entity-text";
import { isShortPhoneTerm, phoneSearchTermDigits } from "./phone-search";

export type PhoneSearchKind = "orders" | "clients";
export interface PhoneSearchStatus { state: "idle" | "loading" | "short" | "limited"; message: string }

const IDLE: PhoneSearchStatus = { state: "idle", message: "" };
const statuses: Record<PhoneSearchKind, PhoneSearchStatus> = { orders: IDLE, clients: IDLE };
const listeners = new Set<() => void>();

function setStatus(kind: PhoneSearchKind, next: PhoneSearchStatus): void {
  const cur = statuses[kind];
  if (cur.state === next.state && cur.message === next.message) return;
  statuses[kind] = next;
  listeners.forEach((l) => l());
}

/** État de la recherche par numéro d'une liste (chargement, « 6 chiffres minimum », plafond atteint) : lu par `<PhoneSearchNotice>` sous le champ. */
export function usePhoneSearchStatus(kind: PhoneSearchKind): PhoneSearchStatus {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => statuses[kind], () => IDLE);
}

/** Envoie le terme au serveur ; `null` si l'appel a échoué (déjà signalé par le transport). `handleStatuses` : 400 et 429 sont rendus à l'appelant. */
export type PhoneSearchTransport = (label: string, url: string, init: { method: "POST"; headers: Record<string, string>; body: string; handleStatuses: number[]; invalidate: false }) => Promise<Response | null>;

const PhoneSearchContext = createContext<{ transport: PhoneSearchTransport; url: string } | null>(null);

export function PhoneSearchProvider({ transport, url = "/api/orders?view=phone_match", children }: { transport: PhoneSearchTransport; /** Route de comparaison (chemin de CLP par défaut). */ url?: string; children: ReactNode }) {
  return <PhoneSearchContext.Provider value={{ transport, url }}>{children}</PhoneSearchContext.Provider>;
}

/** Identifiants (`ids` des commandes ou `keys` des clients) dont le numéro réel contient le terme ; `null` tant qu'il n'y a rien à chercher. */
export function usePhoneMatch(kind: PhoneSearchKind, term: string): Set<string> | null {
  const ctx = useContext(PhoneSearchContext);
  const digits = phoneSearchTermDigits(term);
  const short = isShortPhoneTerm(term);
  const [found, setFound] = useState<{ digits: string; set: Set<string> } | null>(null);
  useEffect(() => {
    if (!digits) { setStatus(kind, short ? { state: "short", message: "6 chiffres minimum" } : IDLE); return; }
    if (!ctx) return;
    let cancelled = false;
    setStatus(kind, { state: "loading", message: "" });
    const timer = setTimeout(async () => {
      const r = await ctx.transport("Recherche par numéro", ctx.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, q: digits }), handleStatuses: [400, 429], invalidate: false });
      const body = (await r?.json().catch(() => null)) as { ids?: unknown; keys?: unknown; message?: unknown; error?: unknown } | null;
      if (cancelled) return;
      if (r && !r.ok) {
        const message = typeof body?.message === "string" ? body.message : null;
        // « 6 chiffres minimum » seulement pour le vrai refus « terme trop court » ; tout autre 400 garde son message (ou un message neutre).
        setStatus(kind, r.status === 429
          ? { state: "limited", message: message ?? "Trop de recherches, réessayez dans une minute." }
          : body?.error === "search_too_short"
            ? { state: "short", message: "6 chiffres minimum" }
            : { state: "limited", message: message ?? "Recherche indisponible." });
        setFound({ digits, set: new Set() });
        return;
      }
      const list = kind === "orders" ? body?.ids : body?.keys;
      setStatus(kind, IDLE);
      setFound({ digits, set: new Set(Array.isArray(list) ? list.map(String) : []) });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [digits, short, kind, ctx]);
  useEffect(() => () => setStatus(kind, IDLE), [kind]);
  return digits && found?.digits === digits ? found.set : null;
}

/** Sous le champ de recherche : « Recherche… » pendant la comparaison au numéro réel, puis le message du serveur (6 chiffres, plafond) ; rien sinon. */
export function PhoneSearchNotice({ kind }: { kind: PhoneSearchKind }): ReactNode {
  const { state, message } = usePhoneSearchStatus(kind);
  if (state === "idle") return null;
  return <RefText variant="caption" tone={state === "limited" ? "warning" : "muted"}><span role="status" data-testid="phone-search-notice">{state === "loading" ? "Recherche…" : message}</span></RefText>;
}
