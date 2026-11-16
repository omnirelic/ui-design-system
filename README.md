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
- Tests : `pnpm test`.
