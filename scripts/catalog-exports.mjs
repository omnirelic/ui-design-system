// Lit les exports de valeur d'un point d'entrée (en suivant `export *`) et leur signature d'une ligne, depuis les types.
// Partagé par la génération (generate-catalog-meta.mjs) et la méta-spec : une seule définition de « export public ».
import { join } from 'node:path';
import ts from 'typescript';

export const ENTRY_FILES = ['src/index.ts', 'src/web/entry-phone.ts', 'src/web/entry-state.ts', 'src/web/entry-query-params.ts', 'src/web/entry-entity-graph.ts', 'src/web/entry-entity.ts', 'src/web/entry-masked-phone.ts', 'src/web/entry-search.ts', 'src/web/entry-amounts.ts'];

export function listValueExports(root, files = ENTRY_FILES) {
  const cfg = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, root);
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
  const out = {};
  for (const file of files) {
    const program = ts.createProgram({ rootNames: [join(root, file)], options: parsed.options });
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(join(root, file));
    const params = (sig) =>
      sig.parameters
        .map((p) => {
          const decl = p.valueDeclaration;
          const name = decl && ts.isParameter(decl) && !ts.isIdentifier(decl.name) ? 'props' : p.name;
          const opt = decl && ts.isParameter(decl) && (decl.questionToken || decl.initializer) ? '?' : '';
          return `${name}${opt}: ${checker.typeToString(checker.getTypeOfSymbolAtLocation(p, decl ?? source), undefined, flags)}`;
        })
        .join(', ');
    for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(source))) {
      const sym = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      if (!(sym.flags & ts.SymbolFlags.Value)) continue;
      const type = checker.getTypeOfSymbolAtLocation(sym, sym.valueDeclaration ?? source);
      const call = type.getCallSignatures()[0];
      const keys = type.getProperties().map((p) => p.name);
      const text = call
        ? `${exported.name}(${params(call)}): ${checker.typeToString(call.getReturnType(), undefined, flags)}`
        : keys.length > 0 && type.flags & ts.TypeFlags.Object && !checker.isArrayType(type)
          ? `${exported.name}: { ${keys.join(', ')} }`
          : `${exported.name}: ${checker.typeToString(type, undefined, flags)}`;
      out[exported.name] = text.replace(/\s+/g, ' ').trim();
    }
  }
  return out;
}
