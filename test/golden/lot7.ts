// Valeurs de référence du lot 7 calculées par le CODE de Chez la Petite (chezlapetite origin/dev bb247c29) : voir generate-clp-golden-lot7.ts.txt.
// Tous les numéros des jeux sont fabriqués (préfixes d'opérateur + 0000 + 2 chiffres, numéros fictifs) : aucun numéro réel.
import { readFileSync } from "node:fs";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Gold = any;
export const golden = (file: string): Gold => JSON.parse(readFileSync(join(__dirname, file), "utf8"));
/** `{ undef: true }` est la façon dont le jeu note `undefined`. */
export const fromGolden = (input: unknown): unknown => (input && typeof input === "object" && (input as { undef?: boolean }).undef ? undefined : input);
export const THROWS = Symbol("throws");
export const unwrap = (r: { ok?: unknown; throw?: string }): unknown => ("throw" in r ? THROWS : r.ok);
export const json = (v: unknown): unknown => JSON.parse(JSON.stringify(v ?? null));
