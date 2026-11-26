// Recherche par numéro de Chez la Petite (web/api/_lib/phone-search.ts côté serveur, web/src/admin/lib/phone-search.ts côté écran) : les listes de l'admin
// ne portent qu'un numéro masqué, la comparaison au numéro réel se fait donc SUR LE SERVEUR, qui ne renvoie que les identifiants des lignes qui
// correspondent (jamais un numéro, même masqué). Garde-fous contre l'extraction chiffre par chiffre : 6 chiffres minimum, 10 recherches par minute
// et par admin, 50 résultats au plus. Le terme saisi n'est jamais journalisé. Le limiteur est INJECTÉ (celui de CLP est en mémoire du processus).

export const PHONE_SEARCH_MIN_DIGITS = 6;
export const PHONE_SEARCH_PER_MINUTE = 10;
export const PHONE_SEARCH_MAX_RESULTS = 50;
/** Numéro COMPLET (9 chiffres) : reconnaît le client dont l'agent tape le numéro (prise de commande) ; ne révèle que ce que l'agent détient déjà. */
export const PHONE_SEARCH_FULL_PER_MINUTE = 60;

const NUMBER_LIKE = /^[\d\s+().-]+$/;

function stripDial(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("237")) d = d.slice(3); // un numéro local camerounais commence par 2 ou 6 : « 237… » est toujours l'indicatif
  return d;
}

/** Côté serveur : terme de type numéro (chiffres, +, espaces, points, tirets, parenthèses) → chiffres sans indicatif 237 ; `null` sinon. Aucun minimum ici. */
export function phoneSearchDigits(term: unknown): string | null {
  const raw = typeof term === "string" ? term.trim() : "";
  if (!raw || !NUMBER_LIKE.test(raw)) return null;
  return stripDial(raw) || null;
}

/** Côté écran : chiffres à chercher si le terme est un numéro assez long (≥ 6 chiffres) ; `null` sinon (recherche par nom seulement). */
export function phoneSearchTermDigits(term: string): string | null {
  const raw = term.trim();
  if (!raw || !NUMBER_LIKE.test(raw)) return null;
  const d = stripDial(raw);
  return d.length >= PHONE_SEARCH_MIN_DIGITS ? d : null;
}

/** Terme numérique encore trop court pour le serveur (3 à 5 chiffres) : l'écran le dit au lieu de filtrer en silence. */
export function isShortPhoneTerm(term: string): boolean {
  const raw = term.trim();
  if (!raw || !NUMBER_LIKE.test(raw) || phoneSearchTermDigits(term)) return false;
  return stripDial(raw).length >= 3;
}

/** Vrai si la requête dépasse `perMinute` pour cette clé (et la compte). */
export type RateLimiterFn = (key: string, perMinute: number) => boolean;

/**
 * Limiteur à fenêtre d'une minute, en mémoire du processus (celui de CLP : `isRateLimited`). Pas un quota distribué : il coupe l'abus trivial.
 * `perMinute` ≤ 0 : désactivé. Horloge injectable.
 */
export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiterFn {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (key, perMinute) => {
    if (!perMinute || perMinute <= 0) return false;
    const t = now();
    let b = buckets.get(key);
    if (!b || t > b.resetAt) {
      b = { count: 0, resetAt: t + 60_000 };
      buckets.set(key, b);
    }
    b.count++;
    return b.count > perMinute;
  };
}

export type PhoneSearchCheckResult = { ok: true; digits: string } | { ok: false; status: number; error: string; message: string };

/** Terme exploitable (forme, longueur) puis quota de l'admin. Le quota ne se consomme qu'une fois le terme valide. Messages en français, comme CLP. */
export function checkPhoneSearch(term: unknown, adminKey: string, isRateLimited: RateLimiterFn): PhoneSearchCheckResult {
  const digits = phoneSearchDigits(term);
  if (!digits || digits.length < PHONE_SEARCH_MIN_DIGITS) return { ok: false, status: 400, error: "search_too_short", message: `Saisissez au moins ${PHONE_SEARCH_MIN_DIGITS} chiffres.` };
  if (digits.length > 15) return { ok: false, status: 400, error: "search_invalid", message: "Numéro invalide." };
  const full = digits.length === 9;
  if (isRateLimited(`${full ? "phone-search-full" : "phone-search"}:${adminKey}`, full ? PHONE_SEARCH_FULL_PER_MINUTE : PHONE_SEARCH_PER_MINUTE)) {
    return { ok: false, status: 429, error: "rate_limited", message: "Trop de recherches par numéro, réessayez dans une minute." };
  }
  return { ok: true, digits };
}

/** Un numéro (n'importe quel format) contient-il ces chiffres ? Les 9 derniers chiffres comptent, l'indicatif est ignoré. */
export function phoneContainsDigits(phone: string | null | undefined, digits: string): boolean {
  const all = (phone ?? "").replace(/\D/g, "");
  if (!all) return false;
  const local = all.length > 9 ? all.slice(-9) : all;
  return local.includes(digits);
}
