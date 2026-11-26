// Génère src/catalog/generated.ts au build : version lue dans package.json et signature d'une ligne de chaque export public.
// Jamais écrit à la main.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listValueExports } from './catalog-exports.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const signatures = listValueExports(root);
const out = `// GÉNÉRÉ par scripts/generate-catalog-meta.mjs au build — ne pas éditer à la main.
export const PACKAGE_VERSION = ${JSON.stringify(pkg.version)};
export const SIGNATURES: Record<string, string> = ${JSON.stringify(signatures, null, 2)};
`;
writeFileSync(join(root, 'src/catalog/generated.ts'), out);
console.log(`[generate-catalog-meta] ${Object.keys(signatures).length} signatures, version ${pkg.version}`);
