// Sous-export `@omnirelic/ui-design-system/state` : cache de ressources « stale-while-revalidate » et état de vue dans l'URL,
// repris de web/src/admin/lib de Chez la Petite. Sans routeur : `createQueryParamHooks` prend son adaptateur (le branchement
// react-router-dom est dans `/query-params`).
export { createQueryParamHooks, withQueryParam } from "./state/query-params-core";
export type { QueryParamsAdapter, SetQueryParams } from "./state/query-params-core";

export { SWR_MAX_AGE_MS, FROM_CACHE_HEADER, clearSwrCache, isFromCache, readSwr, setSwrScope, writeSwr, writeSwrThrottled } from "./state/swr-store";
export { swrJson } from "./state/swr-cache";
export { invalidateAdminResource, invalidateAfterWrite, isRelatedWrite, registerResource } from "./state/invalidation";
export { ADMIN_CHANGE_RESOURCES, CLP_LIVE_RESOURCE_RULES, liveResourceFor, setLiveResourceRules } from "./state/live-resources";
export type { AdminChangeResource, LiveResourceRule } from "./state/live-resources";
export { CLP_NOT_CACHED, createAdminFetch } from "./state/admin-fetch";
export type { AdminFetchDeps, AdminFetchInit } from "./state/admin-fetch";
export { setAdminChangesHook, setAdminFetch, useAdminChanges } from "./state/resource-config";
export type { AdminChangesHook, AdminFetchFn } from "./state/resource-config";
export { useAdminData, useAdminResource, useSeededForm } from "./state/useAdminResource";
export type { AdminData, AdminResource } from "./state/useAdminResource";
