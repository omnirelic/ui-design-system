# Couleurs des statuts (à intégrer au design system)

Note de décision (2026-11-20). Omnirelic rendra aussi cuisines.cm : la palette des statuts doit vivre ici, une seule fois, et être lue par tous les écrans.

## Problème constaté (admin CLP)

- « En attente paiement » (`#FF9800`, orange) et « En préparation » (or `#C4922A`) se confondaient.
- Deux palettes de statuts indépendantes, qui divergent : registre admin (`entity-status.ts`) et file de commandes (`order-status.ts`). Exemple : « Confirmée » bleue d'un côté, orange de l'autre.
- 229 dégradés écrits à la main dans 95 fichiers, sans jeton ni fonction partagée.
- Aucune bibliothèque de couleur ; seul outil : calcul de contraste WCAG (`legible-color.ts`).

## Décision déjà prise

« En préparation » = vert d'eau `#14B8A6` (choisi par Bill).

## Proposition (non encore validée en entier)

| Famille | Statut | Couleur |
|---|---|---|
| Attente | Créée | `#94A3B8` |
| Attente | Attente paiement | `#FF9800` |
| Planifiée | Programmée | `#8B5CF6` |
| Planifiée | Confirmée | `#3B82F6` |
| Cuisine | En préparation | `#14B8A6` |
| Cuisine | Prête | `#84CC16` |
| Livraison | Livreur assigné | `#F472B6` |
| Livraison | Récupérée | `#D946EF` |
| Livraison | En route | `#0EA5E9` |
| Livraison | Arrivée | `#22C55E` |
| Fin | Livrée | `#5FB55F` |
| Fin | Annulée | `#EF4444` |

Teintes encore proches (< 22°) : Créée / Confirmée (le gris est très terne), Créée / En route, Confirmée / En route. Page interactive pour comparer et retoucher : `docs/couleurs-statuts.html`.

## Principes à retenir (design systems de référence)

1. Les statuts se rangent en peu de familles de sens (attente, planifiée, en cours, terminé, annulé) ; une teinte propre par statut.
2. Jamais la couleur seule : libellé ou icône toujours présent (daltoniens).
3. Les couleurs sont des jetons, définis une fois ; aucun hexadécimal écrit dans un écran.
4. Contraste minimal 4,5:1 (texte) et 3:1 (grand texte), à vérifier par calcul.
5. Test avec simulateur de daltonisme.

## À faire dans ce dépôt

- Jetons de statuts par famille + une fonction de contraste.
- Une fonction « halo » (dégradé dérivé d'une couleur d'accent) pour remplacer les copies de CSS ; CSS récent (`color-mix`, dégradés OKLCH) à vérifier sur les navigateurs cibles avant d'ajouter une bibliothèque (culori seulement si génération automatique de nuances).
- Faire lire ces jetons par l'admin CLP (registre unique), omnirelic/web et le rendu cuisines.cm.

Sources : Polaris (Shopify), USWDS, Solstice (Université de Washington), Codex (Wikimedia), design system du PAM.
