# @omnirelic/ui-design-system

Identité visuelle omnirelic — tokens (couleurs, espacement, typographie) +
composants React primitifs (web aujourd'hui, React Native demain)
consommés par tous les providers du réseau. Fondation de
`@omnirelic/components`, pas un remplacement.

## Installation

```bash
npm install @omnirelic/ui-design-system
```

## Usage

```ts
import { theme } from '@omnirelic/ui-design-system/tokens';
import { QrCard } from '@omnirelic/ui-design-system';
```

## Développement

```bash
pnpm install
pnpm run build
```

## Pastille et PhoneInput

- `Pastille` : compteur, statut, donnée, filtre, point. Tons sémantiques (`success`, `warning`, `danger`, `info`, `neutral`) fixes pour tout le réseau ; le ton `brand` suit `--o-accent`. `statusTone(statut)` donne le ton d'un statut de commande, de paiement ou de stock du réseau (libellés : `STEP_LABEL` de `@omnirelic/components`). Un compteur à 0 ou absent ne s'affiche pas.
- `PhoneInput` : pays + numéro national, valeur émise en E.164, validation par pays (`libphonenumber-js`, dépendance du consommateur) ; à importer depuis `@omnirelic/ui-design-system/phone`, absent de la racine. `parseStoredPhone` relit un ancien numéro sans indicatif comme celui du pays par défaut (Cameroun).
- `PhoneField` (aussi `/phone`) : le champ numéro de Chez la Petite repris tel quel — pays + saisie brute tenus par le parent (`country`, `value`, `onCountry`, `onChange`, `onBlur`, `invalid`, `autoFocus`, `errorId`), 25 pays, drapeaux SVG intégrés, liste ouverte vers le haut. `resolvePhone(pays, saisie)` donne l'E.164 (`null` si invalide ; Cameroun strict 6XXXXXXXX, un `+` ou `00` collé change le pays). Sans `libphonenumber-js`. Couleurs du thème (`--o-accent`, `--o-card`…).
- Tests : `pnpm test`.

## État dans l'URL et cache de ressources

Repris tel quel de `web/src/admin/lib` de Chez la Petite (noms, signatures, comportements ; tests miroir dans `test/`).

- `@omnirelic/ui-design-system/query-params` : `useQueryParam(key)`, `useSetQueryParams()`, `useQueryParamItem(key, items, getId, legacyIds?)`, `withQueryParam(prev, key, value)`. Les autres paramètres de l'URL sont toujours conservés (jamais de `setSearchParams` qui écrase) ; un identifiant inconnu donne `null`. Branché sur `react-router-dom` (peerDependency optionnelle, >= 6).
- `@omnirelic/ui-design-system/state` : sans routeur. `createQueryParamHooks(adaptateur)` fabrique les trois mêmes hooks à partir de `() => [URLSearchParams, (prev => next) => void]` (adaptateur de test, autre routeur). Cache « stale-while-revalidate » : `swrJson` (copie locale puis réponse fraîche, requêtes identiques partagées, `ttlMs`, `quietStatuses`), `readSwr`/`writeSwr`/`setSwrScope`/`clearSwrCache` (IndexedDB cloisonné par utilisateur, repli mémoire, 7 jours), `registerResource`/`invalidateAdminResource`/`invalidateAfterWrite`/`isRelatedWrite` (une écriture relit les ressources liées), `useAdminResource`/`useAdminData`/`useSeededForm`, `liveResourceFor` (règles de CLP, remplaçables par `setLiveResourceRules`).
- Branchements propres à l'application, injectés au démarrage (CLP les câble en dur) : `setAdminFetch(createAdminFetch({ pushError, reportNetworkSuccess, reportNetworkFailure, fetch }))` pour le toast d'erreur, la connectivité et le transport ; `setAdminChangesHook(hook)` pour l'abonnement temps réel. Sans injection : `fetch` simple, aucun toast, aucun abonnement.
- Non repris : `useAdminChanges` réel (socket, `connectRealtime`, filet `useSafetyRefresh`), `error-bus`, `connectivity`.

## Catalogue

`@omnirelic/ui-design-system/catalog` exporte `CATALOG` : tokens introspectés et composants web avec leurs états, une entrée par export public (racine, `/phone`, `/state` et `/query-params`) ou une exclusion motivée. `test/catalog-rules.test.ts` échoue si un export n'a ni l'un ni l'autre ; signatures et version sont générées au build (`scripts/generate-catalog-meta.mjs`).

## Pairs (peerDependencies)

- Web : `react` et `react-qr-code` (la racine exporte `QrCard`). `libphonenumber-js` seulement pour `/phone`, `react-router-dom` seulement pour `/query-params`.
- Natif (`/native`) : `react-native`, `react-native-svg`, `expo-camera`, `expo-linear-gradient`, `phosphor-react-native` sont à installer par l'app mobile ; ils ne sont **pas** déclarés en peerDependencies. GitHub Packages retire `peerDependenciesMeta` du registre : un peer natif, même marqué optionnel, fait échouer `npm install` (ERESOLVE) dans une app web.
