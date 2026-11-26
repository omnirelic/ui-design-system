// Retire les montants d'une ligne de texte libre (notes d'historique comme « Paiement ORANGE initié · 4 000 XAF »), pour « Afficher les montants » éteint :
// le panneau de détail ne montre aucun montant, notes comprises. Reprend web/src/admin/lib/mask-amounts.ts de Chez la Petite, y compris sa largesse :
// « Le 12 F » devient « Le » (toute suite de chiffres suivie de XAF, FCFA ou F est un montant).
const AMOUNT = /[+−-]?\s?\d[\d\s\u00a0\u202f.,]*\s?(?:XAF|FCFA|F)\b/gi;

export function maskAmounts(text: string): string {
  return text
    .replace(AMOUNT, "")
    .replace(/\(\s*\)/g, "") // parenthèses vides laissées derrière
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;:.])/g, "$1") // espace laissé devant une ponctuation
    .replace(/\s*[·,:;-]\s*$/, "") // séparateur resté en fin de ligne
    .trim();
}
