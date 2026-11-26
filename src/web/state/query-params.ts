// Branchement react-router-dom (celui de Chez la Petite) : mêmes noms et mêmes signatures que web/src/admin/lib/query-params.ts
// et useQueryParamItem.ts. `react-router-dom` est une peerDependency optionnelle ; sans routeur, utiliser `createQueryParamHooks`
// (sous-chemin `/state`) avec son propre adaptateur.
import { useSearchParams } from "react-router-dom";
import { createQueryParamHooks } from "./query-params-core";

export { withQueryParam } from "./query-params-core";

export const { useQueryParam, useSetQueryParams, useQueryParamItem } = createQueryParamHooks(useSearchParams);
