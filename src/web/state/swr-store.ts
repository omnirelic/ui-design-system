// Cache « stale-while-revalidate » des GET admin, dans IndexedDB (les listes de commandes dépassent
// vite les quotas de sessionStorage). L'écran affiche la dernière réponse connue tout de suite, puis
// la remplace par la réponse fraîche ; hors-ligne, il garde la copie locale (cf. OfflineBanner).
// Données personnelles (noms, téléphones) : cache PAR ADMIN (`setSwrScope`), vidé à la déconnexion
// (`clearSwrCache`) et borné dans le temps. Indisponible (mode privé, refus) → pas de cache, jamais d'erreur.
const DB_NAME = "clp-admin-cache";
const STORE = "responses";
export const SWR_MAX_AGE_MS = 7 * 24 * 3600_000;

type Entry = { data: unknown; at: number };
const memory = new Map<string, Entry>(); // repli + évite un aller-retour IndexedDB pour les relectures
let scope = "anon";
let dbPromise: Promise<IDBDatabase | null> | null = null;

export function setSwrScope(adminId: string | number | null | undefined): void { scope = adminId == null ? "anon" : String(adminId); }
const keyOf = (url: string) => `${scope}|${url}`;

function openDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
  }
  return dbPromise;
}

function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return openDb().then((db) => db ? new Promise<T | undefined>((resolve) => {
    try {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  }) : undefined);
}

export async function readSwr<T>(url: string, nowMs = Date.now()): Promise<{ data: T; at: number } | null> {
  const k = keyOf(url);
  const e = memory.get(k) ?? ((await idb<Entry>("readonly", (s) => s.get(k))) ?? null);
  if (!e || nowMs - e.at >= SWR_MAX_AGE_MS) return null;
  memory.set(k, e);
  return { data: e.data as T, at: e.at };
}

/** Écrit sauf si une copie très récente existe déjà (évite de réécrire à chaque tick d'un polling). */
export function writeSwrThrottled(url: string, data: unknown, minAgeMs = 3000, nowMs = Date.now()): void {
  const e = memory.get(keyOf(url));
  if (e && nowMs - e.at < minAgeMs) return;
  writeSwr(url, data, nowMs);
}

export function writeSwr(url: string, data: unknown, nowMs = Date.now()): void {
  const k = keyOf(url);
  const e: Entry = { data, at: nowMs };
  memory.set(k, e);
  void idb("readwrite", (s) => s.put(e, k));
}

export async function clearSwrCache(): Promise<void> {
  memory.clear();
  await idb("readwrite", (s) => s.clear());
}


export const FROM_CACHE_HEADER = "x-clp-from-cache";
/** Réponse resservie par admin-fetch depuis la copie locale (réseau tombé), et non par le serveur. */
export const isFromCache = (r: Response): boolean => r.headers?.get(FROM_CACHE_HEADER) === "1";
