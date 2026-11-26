// Un nom de personne s'écrit toujours pareil : « Bill Somen », jamais « BILL SOMEN » ni « bill somen ». Une seule règle pour
// l'enregistrement (api/) et l'affichage (src/) ; l'engine en a une copie, avec les mêmes tests (engine/src/common/person-name.ts).
//
// Règle : chaque suite de lettres prend une majuscule puis des minuscules (« JEAN-PAUL » → « Jean-Paul », « N'GUESSAN » → « N'Guessan »).
// Un mot saisi avec une majuscule INTERNE suivie de minuscules (« McDonald », « DiCaprio ») est gardé tel quel : c'est un choix de celui qui l'a tapé.
// Aucune règle sur les particules (« de », « du ») : on ne devine pas.

const LETTER_RUN = /[\p{L}\p{M}]+/gu;
// minuscule, majuscule(s), minuscule : « McDonald », « DiCaprio ». « bILL » (majuscules verrouillées inversées) n'en est pas un.
const INTERNAL_CAPITAL = /\p{Ll}\p{Lu}+\p{Ll}/u;

function titleCaseRun(run: string): string {
  if (INTERNAL_CAPITAL.test(run)) return run;
  const lower = run.toLowerCase();
  return lower.replace(/^\p{L}/u, first => first.toUpperCase());
}

/** « BILL SOMEN » / « bill somen » → « Bill Somen » ; vide si absent. Idempotente. */
export function formatPersonName(raw: string | null | undefined): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").replace(LETTER_RUN, titleCaseRun);
}

/** Pour l'enregistrement : le nom formaté, ou null quand il ne reste rien (colonne nullable). */
export function formatPersonNameOrNull(raw: string | null | undefined): string | null {
  return formatPersonName(raw) || null;
}
