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

## Catalogue

`@omnirelic/ui-design-system/catalog` exporte `CATALOG` : tokens introspectés et composants web avec leurs états, une entrée par export public (racine et `/phone`) ou une exclusion motivée. `test/catalog-rules.test.ts` échoue si un export n'a ni l'un ni l'autre ; signatures et version sont générées au build (`scripts/generate-catalog-meta.mjs`).

## Pairs (peerDependencies)

- Web : `react` et `react-qr-code` (la racine exporte `QrCard`). `libphonenumber-js` seulement pour `/phone`.
- Natif (`/native`) : `react-native`, `react-native-svg`, `expo-camera`, `expo-linear-gradient`, `phosphor-react-native` sont à installer par l'app mobile ; ils ne sont **pas** déclarés en peerDependencies. GitHub Packages retire `peerDependenciesMeta` du registre : un peer natif, même marqué optionnel, fait échouer `npm install` (ERESOLVE) dans une app web.
