// Sous-export `@omnirelic/ui-design-system/entity-graph` : le moteur du graphe d'entités de Chez la Petite, sans React. L'application injecte ses entités.
export { createEntityGraph, checkEntityGraph, entityParams, codeLines, handWrittenEntityLink, findHandWrittenEntityLinks } from "./entity-graph";
export type { EntityDef, EntityRelation, EntityLinkInfo, EntityGraph, EntityGraphConfig } from "./entity-graph";
