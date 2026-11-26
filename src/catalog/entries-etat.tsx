import { useSyncExternalStore } from "react";
import { ADMIN_CHANGE_RESOURCES, CLP_LIVE_RESOURCE_RULES, CLP_NOT_CACHED, FROM_CACHE_HEADER, SWR_MAX_AGE_MS, createQueryParamHooks, isRelatedWrite, liveResourceFor, withQueryParam } from "../web/entry-state";
import type { QueryParamsAdapter, SetQueryParams } from "../web/entry-state";
import type { CatalogEntrySourceInterface } from "./types";

// URL en mémoire (aucun routeur, aucune vraie adresse) : l'exemple se manipule et montre la chaîne de requête obtenue.
function memoryParams(initial: string): QueryParamsAdapter {
  let search = initial;
  const listeners = new Set<() => void>();
  const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
  const set: SetQueryParams = (update) => { search = update(new URLSearchParams(search)).toString(); listeners.forEach((l) => l()); };
  return () => [new URLSearchParams(useSyncExternalStore(subscribe, () => search, () => search)), set] as const;
}
const demo = createQueryParamHooks(memoryParams("section=links"));

function UrlStateDemo() {
  const [tab, setTab] = demo.useQueryParam("tab");
  const patch = demo.useSetQueryParams();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["a", "b"].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: "6px 12px", cursor: "pointer", fontWeight: tab === t ? 700 : 400 }}>{`Onglet ${t}`}</button>
        ))}
        <button type="button" onClick={() => patch({ tab: null, item: null })} style={{ padding: "6px 12px", cursor: "pointer" }}>Effacer</button>
      </div>
      <code>{`tab = ${tab ?? "null"}`}</code>
    </div>
  );
}

export const ETAT_ENTRIES: CatalogEntrySourceInterface[] = [
  { name: "createQueryParamHooks", group: "etat", kind: "function", render: () => <UrlStateDemo /> },
  {
    name: "withQueryParam",
    group: "etat",
    kind: "function",
    examples: () => [
      { call: "withQueryParam(?recipe=a, 'item', 'b')", result: withQueryParam(new URLSearchParams("recipe=a"), "item", "b").toString() },
      { call: "withQueryParam(?recipe=a&item=b, 'item', null)", result: withQueryParam(new URLSearchParams("recipe=a&item=b"), "item", null).toString() },
    ],
  },
  { name: "SWR_MAX_AGE_MS", group: "etat", kind: "constant", examples: () => [{ call: "SWR_MAX_AGE_MS / 3_600_000", result: `${SWR_MAX_AGE_MS / 3_600_000} h` }] },
  { name: "FROM_CACHE_HEADER", group: "etat", kind: "constant", examples: () => [{ call: "FROM_CACHE_HEADER", result: FROM_CACHE_HEADER }] },
  {
    name: "isRelatedWrite",
    group: "etat",
    kind: "function",
    examples: () => [
      ["/api/menu/purchase-lists", "/api/menu/purchase-lists/pl1"],
      ["/api/menu/items", "/api/menu/purchase-lists/pl1"],
      ["/api/orders?limit=50", "/api/orders/42?x=1"],
    ].map(([r, w]) => ({ call: `isRelatedWrite('${r}', '${w}')`, result: String(isRelatedWrite(r, w)) })),
  },
  { name: "ADMIN_CHANGE_RESOURCES", group: "etat", kind: "constant", examples: () => [{ call: "ADMIN_CHANGE_RESOURCES.length", result: String(ADMIN_CHANGE_RESOURCES.length) }, { call: "ADMIN_CHANGE_RESOURCES[0]", result: ADMIN_CHANGE_RESOURCES[0] }] },
  { name: "CLP_LIVE_RESOURCE_RULES", group: "etat", kind: "constant", examples: () => [{ call: "CLP_LIVE_RESOURCE_RULES.length", result: String(CLP_LIVE_RESOURCE_RULES.length) }] },
  {
    name: "liveResourceFor",
    group: "etat",
    kind: "function",
    examples: () => ["/api/orders?view=clients", "/api/menu/items", "/api/support/conversations", "/api/analytics/summary"].map((u) => ({ call: `liveResourceFor('${u}')`, result: String(liveResourceFor(u)) })),
  },
  {
    name: "CLP_NOT_CACHED",
    group: "etat",
    kind: "constant",
    examples: () => ["/api/auth/me", "/api/orders"].map((u) => ({ call: `CLP_NOT_CACHED.test('${u}')`, result: String(CLP_NOT_CACHED.test(u)) })),
  },
];
