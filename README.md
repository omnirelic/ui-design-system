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

## Briques de base de Chez la Petite (lot 2)

Reprises de `web/src/ui` et `web/src/admin/ui` de CLP (gelé) : mêmes props, états, tailles et comportements ; seules les couleurs passent par les jetons du thème (`--o-*`).

- `Drawer` : panneau latéral droit (`open`, `onClose`, `title`, `crumbs`, `width` 560, `actions`, `footer`, `headerExtra`, `veil`, `outsideClose`, `bare`, `bodyRef`, `skin`), sortie animée 280 ms, fermeture par ×, Échap ou fond. Comme CLP : ni piège de focus ni rôle `dialog`.
- `Alert` (`success`, `warning`, `error`, `info`), `Spinner` (24 px, 0,7 s), squelettes `Sk`, `SkRows`, `SkTable`, `SkGrid`, `SkBar`, `Pagination` (`page`, `totalPages`, `onChange`).
- `ConfirmDialog` (modale 420 px, `danger`, `loading`, `zIndex`, `initialFocus`) ; `Modal` accepte désormais `maxWidth` (380) et `zIndex` (60).
- `CopyButton` / `CopyTextButton` (icône → coche + « Copié » 1,8 s), `useCopied`, `writeClipboard` (repli `execCommand`).
- `Icon` + `ICONS` : registre sémantique `res-`, `action-`, `status-`, `step-`, `ui-`, `state-`, `service-`, `loc-`, `kind-`, `nav-`, `pay-`, glyphes Phosphor (dépendance `@phosphor-icons/react` 2.1.10, un import par icône). Les couleurs en dur de CLP deviennent des tons du thème ; familles propres à l'admin ou au métier CLP non reprises.
- Styles posés une fois dans `<head>` au chargement (`omni-controls`, `omni-spin`, `omni-sk`).

## Tableau et menu déroulant de Chez la Petite (lot 3)

Reprises de `web/src/admin/ui` (`DataTable.tsx`, `Pager.tsx`, `EmptyState.tsx`, `lib/usePagination.ts`) et `web/src/ui/Select.tsx` de CLP (gelé) : mêmes classes, mesures et clavier ; couleurs en jetons `--o-*`. CLP n'a ni tri, ni sélection par cases, ni en-tête collant, ni filtres de colonne : ils ne sont pas inventés ici.

- `DataTable` (`columns`, `rows`, `rowKey`, `onRowClick`, `selectedKey`, `isHighlighted`, `renderExpanded`, `pageSize`, `resetKey`, `emptyTitle`, `emptyHint`) : grille en sous-grille, une carte arrondie par ligne (8 px, 0,625 / 0,875 rem), en-têtes 12 px en capitales espacées, planchers 112 px (`fr`) et 160 px (`auto`) avec défilement horizontal, cartes empilées sous 640 px, ligne cliquable au clavier (Entrée, Espace).
- `Pager` + `usePagination` + `PAGE_SIZES` (10, 25, 50, 100) : « 1–10 sur 30 », fenêtre 1 … n-1 n n+1 … N, choix « n / page ». Distinct de `Pagination` (simple).
- `EmptyState` (`icon`, `title`, `hint`, `action`).
- `Select` : portail en `position: fixed`, ouverture vers le haut si la place manque, flèches, Début, Fin, Entrée, Échap, focus rendu au déclencheur, recherche sans accent ni casse (`searchable`), variante icône, `bare`, `uiSize` sm / md, `height`, `width`. Ajouts omnirelic, absents de CLP et sans effet quand omis : `placeholder`, `searchPlaceholder`, `SelectOption.pinned`.
- `SearchableSelect` : **déprécié**, API d'origine conservée (`value` nullable, `sub`, `pinnedOption`), rendu par `Select searchable` : le comportement est désormais celui de CLP. Migrer vers `Select`.
- Styles posés une fois dans `<head>` (`omni-dt`, `omni-select`) ; `omni-controls` gagne la variante `seg`.

## État dans l'URL et cache de ressources

Repris tel quel de `web/src/admin/lib` de Chez la Petite (noms, signatures, comportements ; tests miroir dans `test/`).

- `@omnirelic/ui-design-system/query-params` : `useQueryParam(key)`, `useSetQueryParams()`, `useQueryParamItem(key, items, getId, legacyIds?)`, `withQueryParam(prev, key, value)`. Les autres paramètres de l'URL sont toujours conservés (jamais de `setSearchParams` qui écrase) ; un identifiant inconnu donne `null`. Branché sur `react-router-dom` (peerDependency optionnelle, >= 6).
- `@omnirelic/ui-design-system/state` : sans routeur. `createQueryParamHooks(adaptateur)` fabrique les trois mêmes hooks à partir de `() => [URLSearchParams, (prev => next) => void]` (adaptateur de test, autre routeur). Cache « stale-while-revalidate » : `swrJson` (copie locale puis réponse fraîche, requêtes identiques partagées, `ttlMs`, `quietStatuses`), `readSwr`/`writeSwr`/`setSwrScope`/`clearSwrCache` (IndexedDB cloisonné par utilisateur, repli mémoire, 7 jours), `registerResource`/`invalidateAdminResource`/`invalidateAfterWrite`/`isRelatedWrite` (une écriture relit les ressources liées), `useAdminResource`/`useAdminData`/`useSeededForm`, `liveResourceFor` (règles de CLP, remplaçables par `setLiveResourceRules`).
- Branchements propres à l'application, injectés au démarrage (CLP les câble en dur) : `setAdminFetch(createAdminFetch({ pushError, reportNetworkSuccess, reportNetworkFailure, fetch }))` pour le toast d'erreur, la connectivité et le transport ; `setAdminChangesHook(hook)` pour l'abonnement temps réel. Sans injection : `fetch` simple, aucun toast, aucun abonnement.
- Non repris : `useAdminChanges` réel (socket, `connectRealtime`, filet `useSafetyRefresh`), `error-bus`, `connectivity`.

## Graphe d'entités de Chez la Petite (lot 5, moteur)

Repris de `web/src/admin/shell/entity-graph.ts` de CLP (gelé) et de ses deux règles (`entity-graph.test.ts`, `entity-links.rules.test.ts`). Sous-chemin `@omnirelic/ui-design-system/entity-graph`, sans React.

- Une entité (commande, client, livreur…) s'ouvre dans UNE vue par UN paramètre d'URL ; une relation se lit dans les deux sens ; un lien profond se fabrique par `entityPath(kind, id, extra?)`, jamais à la main. Les liens vers une entité sont un composant (`EntityRef`, lot suivant), pas une chaîne.
- Le moteur n'a aucune entité en dur : l'application injecte les siennes. `createEntityGraph({ defs, relations, viewPath })` rend `{ kinds, entityPath, linksFrom, isEntityKind }`. `defs` : `label`, `view`, `param` (null = vue seule), `fixed` (onglet interne), `pathId` (page pleine `/…/:id`), `idIs`, `person`, `photo`, `icon`, `intermediateIcon`. `viewPath(view)` donne le chemin avec son préfixe (CLP : `/admin/${VIEW_TO_PATH[view]}`).
- `checkEntityGraph(graph, { reservedParams?, root? })` : le test de cohérence de CLP, réutilisable. Rend les violations (vue inconnue, collision vue + paramètre, paramètre réservé, relation inconnue / à soi-même / en double, entité orpheline ou inaccessible, relation illisible dans un sens) ; l'application attend `[]`.
- `findHandWrittenEntityLinks(graph, [{ path, source }], allowed?)` : la règle « zéro URL d'entité à la main » (aucun `?order=` ou `&client=` hors du graphe, de ses tests et des chemins `allowed`), sans baseline. Aides : `entityParams`, `handWrittenEntityLink`, `codeLines`.
- Référence : `test/fixtures/clp-entities.ts` transcrit les 23 entités, les 40 relations, `VIEW_TO_PATH` et `clientEntityKey` de CLP, et les tests de CLP y sont rejoués. Ce jeu n'est pas dans le paquet : cuisines.cm fournit le sien.
- Écarts : `view` est une chaîne libre (CLP : le type `View` de son registre) ; `icon` et `intermediateIcon` vivent dans la définition (CLP : `THING_ICON` de `pastille-model.ts`) ; `clientEntityKey` (téléphone camerounais) est propre à CLP : dans la référence seulement ; le document généré `admin-navigation-graphe.html` n'est pas repris.

## EntityRef et pastille d'entité de Chez la Petite (lot 5, composants)

Repris de `web/src/admin/ui/entity/` (`EntityRef`, `RefParts`, `HoverCard`) et `web/src/admin/ui/pastille/` (capsule, disque de tête, modèle de segments) de CLP (gelé). Sous-chemin `@omnirelic/ui-design-system/entity` ; dépendances : `react-router-dom` (liens, peer optionnelle comme `/query-params`) et `@floating-ui/react` 0.27.20 (dépendance épinglée, la carte au survol). Le moteur du graphe est dans `/entity-graph`.

- `<EntityRefProvider value={{ graph, formatMoney?, openHere? }}>` : l'application injecte son graphe (`createEntityGraph`), le formatage d'un montant de segment (défaut : XAF entier, « 1 550 XAF ») et l'ouverture sur place (`openHere(kind, id)` rend la fonction d'ouverture ou `undefined` ; CLP : le plat dans Commandes s'ouvre dans le tiroir).
- `EntityRef` (`kind`, `id`, `label`, `sub`, `subTone`, `dot`, `avatar`, `swatch`, `lead`, `variant`, `badge`, `extra`, `onOpen`, `linkless`, `noMenu`, `intermediate`, `quiet`, `qty`, `variation`, `stock`) : formes `num`, `point`, `compact`, `chip` (défaut), `row`, `card`, `detail`. Le lien est `graph.entityPath(kind, id)`, le menu au survol propose « Ouvrir : … » et « Copier le nom », le nom d'une personne (`person`) est en casse de titre.
- `entityRefFor(kind, defaults?)` remplace les `export const VehicleRef = …` de CLP. Les composants dérivés de CLP qui portent des données de la commande, du client, du livreur ou du panier (`OrderRef`, `ClientRef`, `CourierRef`, `BagRef`, `TransactionRef`, `DraftRef`…) restent à l'application : ils s'écrivent autour d'`EntityRef` avec ses coques (`RefChipShell`, `RefNumShell`, `RefRowShell`, `RefCardShell`, `RefDetailShell`, `RefMenu`, `RefLink`).
- Pastille : `PastilleCapsule` (formes `pill`, `compact`, `point` ; `qualifier`, `gold`, `prefix`, `dim`), `PastilleBox` (paliers de compacité 520, 460, 400, 270, 190 px par requêtes de conteneur), `LeadDisc`, `Segments`, `QualifierSegment`, `VariationChip`, `StockBadge`, `arrangeSegments` (grammaire Libellé | État | Valeur | Quand, quatre segments au plus), `entityChipModel`, `leadFor` (lit `person`, `photo`, `icon`, `intermediateIcon` de la définition), `legibleColor`. `HoverCard` (niveau `Z_CARD` 1400).
- Couleurs : jetons `--o-*` uniquement (méta-spec `test/entity-tokens.rules.test.ts` : ni hexadécimal, ni emoji dans ces fichiers) ; classes `clp-` devenues `omni-`.
- Non repris : pastilles jumelées et empilées (`GluedPastilles`, `StackedPastilles`), `PastilleRow`, `QUALIFIERS`, `ClientIdentity`, pastille du livreur, fiches rapides (`QuickCard`, `CourierCard`, `ClientQuickCard`, `OrderQuickCard`, `DraftCard`), `PhoneRef`, `MaskedPhone`, `AddressRef`. À porter avec le lot des cartes commande et de la fiche contact.
- Écarts connus : `res-intermediate` (icône maison de CLP) absente du registre : la référence prend `action-produce` ; l'infobulle en écho « Ouvrir : … » du menu (`ActionButton`, `CopyButton` de CLP) n'est pas reprise ; la teinte « violet » du badge prend le ton `info` ; le fond du menu est la carte du thème, sans le gris légèrement plus clair de CLP.

## Catalogue

`@omnirelic/ui-design-system/catalog` exporte `CATALOG` : tokens introspectés et composants web avec leurs états, une entrée par export public (racine, `/phone`, `/state` et `/query-params`) ou une exclusion motivée. `test/catalog-rules.test.ts` échoue si un export n'a ni l'un ni l'autre ; signatures et version sont générées au build (`scripts/generate-catalog-meta.mjs`).

## Pairs (peerDependencies)

- Web : `react` et `react-qr-code` (la racine exporte `QrCard`). `libphonenumber-js` seulement pour `/phone`, `react-router-dom` seulement pour `/query-params`.
- Natif (`/native`) : `react-native`, `react-native-svg`, `expo-camera`, `expo-linear-gradient`, `phosphor-react-native` sont à installer par l'app mobile ; ils ne sont **pas** déclarés en peerDependencies. GitHub Packages retire `peerDependenciesMeta` du registre : un peer natif, même marqué optionnel, fait échouer `npm install` (ERESOLVE) dans une app web.
