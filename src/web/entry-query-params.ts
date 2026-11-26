// Sous-export `@omnirelic/ui-design-system/query-params` : état de vue dans l'URL branché sur react-router-dom (peerDependency optionnelle).
export { useQueryParam, useQueryParamItem, useSetQueryParams, withQueryParam } from "./state/query-params";

// Section ouverte d'un rail (SectionRail) portée par l'URL : `?<param>=`, la première section n'écrit rien dans l'URL.
import { createRailSectionHook } from "./AdminSectionRail";
import { useQueryParam as useQueryParamForRail } from "./state/query-params";
export const useRailSection = createRailSectionHook(useQueryParamForRail);
