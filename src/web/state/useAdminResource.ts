import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { swrJson } from "./swr-cache";
import { useAdminChanges } from "./resource-config";
import { liveResourceFor } from "./live-resources";
import { registerResource } from "./invalidation";

export { invalidateAdminResource } from "./invalidation";

export interface AdminResource<T> {
  data: T | undefined;
  /** Aucune donnée (ni locale ni réseau) pour l'instant. */
  loading: boolean;
  /** La copie affichée vient du cache local, la réponse fraîche n'est pas encore là. */
  stale: boolean;
  /** Le réseau n'a pas répondu et il n'y a aucune copie locale. */
  failed: boolean;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | undefined>>;
}

/**
 * GET admin avec copie locale (swr-cache) : affichage immédiat, revalidation en fond. `url` null = désactivé.
 * La donnée exposée est TOUJOURS celle de l'url courante : on mémorise l'url dont elle vient (`state.url`). Sans ça, l'ancienne donnée
 * restait lisible pendant le rendu qui suit un changement d'url (elle n'était vidée que dans un effet) et la réponse EN RETARD de
 * l'ancienne url s'appliquait sous la nouvelle — un consommateur agissant sur `data` (ex. préremplissage d'adresse) y voyait un autre client.
 */
export function useAdminResource<T>(context: string, url: string | null, opts: { ttlMs?: number; quietStatuses?: number[] } = {}): AdminResource<T> {
  const ttlMs = opts.ttlMs ?? 0;
  const quiet = opts.quietStatuses?.join(",") ?? ""; // clé stable (un tableau littéral changerait à chaque rendu)
  const [state, setState] = useState<{ data: T | undefined; url: string | null }>({ data: undefined, url: null });
  const [stale, setStale] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(url !== null);
  const alive = useRef(true);
  const hasData = useRef(false);
  const urlRef = useRef(url);
  urlRef.current = url;

  // `force` (reload, invalidation après écriture) ignore le TTL ; seul le premier chargement le respecte.
  const load = useCallback(async (force = false) => {
    if (url === null) return;
    const ok = await swrJson<T>(context, url, (d, isStale) => {
      if (!alive.current) return;
      hasData.current = true;
      setState({ data: d, url }); setStale(isStale); setFailed(false); // `url` = celle de CETTE lecture : si elle n'est plus la courante, la donnée reste masquée
    }, { ttlMs: force ? 0 : ttlMs, useCache: !force, quietStatuses: quiet ? quiet.split(",").map(Number) : undefined }); // relecture forcée = après une écriture : jamais l'ancienne copie locale d'abord (la liste reviendrait sans le nouvel élément)
    if (!alive.current) return;
    if (!ok && !hasData.current) setFailed(true);
    setPending(false);
  }, [context, url, ttlMs, quiet]);

  useEffect(() => {
    alive.current = true;
    hasData.current = false;
    setState({ data: undefined, url }); setFailed(false); setPending(url !== null);
    void load();
    return () => { alive.current = false; };
  }, [load, url]);

  // Une écriture d'un autre admin (ou du client) sur cette ressource : relecture silencieuse, sans toucher
  // à ce que l'utilisateur est en train de saisir (voir useSeededForm : un formulaire modifié n'est pas écrasé).
  useAdminChanges(liveResourceFor(url), () => { void load(true); });

  // Une écriture qui réussit (adminFetch) ou `invalidateAdminResource(prefix)` relit cette ressource : plus de rechargement de page à la main.
  useEffect(() => (url === null ? undefined : registerResource(url, () => { void load(true); })), [url, load]);

  // Identité stable (comme le setter d'un useState) : écrit sur l'url COURANTE, y compris avant la première réponse.
  const setData = useCallback<Dispatch<SetStateAction<T | undefined>>>(
    action => setState(prev => ({ data: typeof action === "function" ? (action as (p: T | undefined) => T | undefined)(prev.url === urlRef.current ? prev.data : undefined) : action, url: urlRef.current })),
    [],
  );

  const current = state.url === url;
  const data = current ? state.data : undefined;
  return { data, loading: url !== null && data === undefined && (pending || !current), stale: current && stale, failed: current && failed, reload: () => load(true), setData };
}

export interface AdminData<T> {
  data: T;
  /** Même signature que le setter d'un useState : les vues migrées gardent leur code de mise à jour optimiste. */
  setData: Dispatch<SetStateAction<T>>;
  /** Aucune copie (locale ou réseau) à afficher pour l'instant. */
  loading: boolean;
  stale: boolean;
  failed: boolean;
  reload: () => Promise<void>;
}

/** Comme useAdminResource, avec une valeur initiale : remplace `useState(initial)` + `load()` + `useEffect` dans une vue. */
export function useAdminData<T>(context: string, url: string | null, initial: T): AdminData<T> {
  const res = useAdminResource<T>(context, url);
  const data = (Array.isArray(initial) && !Array.isArray(res.data) ? initial : (res.data ?? initial)) as T;
  const setData: Dispatch<SetStateAction<T>> = (action) =>
    res.setData(prev => (typeof action === "function" ? (action as (p: T) => T)(prev ?? initial) : action));
  return { data, setData, loading: res.loading, stale: res.stale, failed: res.failed, reload: res.reload };
}

/**
 * État de formulaire alimenté par une ressource : affiché dès la copie locale, puis il SUIT le serveur tant que
 * l'utilisateur n'a rien modifié. Dès qu'il a modifié quelque chose, une relecture ne touche plus ni sa saisie
 * ni `base` (la version d'où il est parti, référence de la comparaison avec ce qu'un autre a enregistré entre-temps,
 * cf. edit-guard). `resync(valeurs?)` : « ces valeurs (ou ce qui est à l'écran) sont enregistrées » — à appeler après
 * une sauvegarde, avant de recharger la ressource.
 */
export function useSeededForm<S, T>(source: S | undefined, make: (s: S) => T, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [base, setBase] = useState<T | null>(null);
  const baseJson = useRef<string | null>(null);
  const valueRef = useRef(value); valueRef.current = value;
  const makeRef = useRef(make); makeRef.current = make;
  useEffect(() => {
    if (source === undefined) return;
    const next = makeRef.current(source);
    const dirty = baseJson.current !== null && JSON.stringify(valueRef.current) !== baseJson.current;
    if (dirty) return; // saisie en cours : on n'y touche pas, la référence reste celle de départ
    baseJson.current = JSON.stringify(next);
    setValue(next); setBase(next);
  }, [source]);
  const resync = (saved?: T) => {
    const v = saved ?? valueRef.current;
    baseJson.current = JSON.stringify(v);
    setBase(v);
    if (saved !== undefined) setValue(saved);
  };
  const dirty = base !== null && JSON.stringify(value) !== baseJson.current;
  return { value, setValue, resync, base, dirty };
}
