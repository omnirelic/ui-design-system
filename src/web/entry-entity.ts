// Sous-export `@omnirelic/ui-design-system/entity` : EntityRef de Chez la Petite (formes num, point, compact, chip, row, card, detail), la pastille d'entité, la carte au survol.
// Dépend du graphe injecté (`EntityRefProvider`), de react-router-dom (liens) et de @floating-ui/react ; le moteur du graphe est dans `/entity-graph`.
export { EntityRef, entityRefFor } from "./EntityRef";
export type { EntityRefProps, RefBadgeColor } from "./EntityRef";
export { EntityRefProvider, useEntityRef, defaultFormatMoney } from "./entity-context";
export type { EntityRefContextValue } from "./entity-context";
export { HoverCard, Z_CARD } from "./HoverCard";
export type { HoverCardProps } from "./HoverCard";
export { RefChipShell, RefNumShell, RefRowShell, RefCardShell, RefDetailShell, RefMenu, RefLink, Dot, Swatch, Sep } from "./RefParts";
export type { RefAction, RefVariant } from "./RefParts";
export { PastilleCapsule, PastilleBox } from "./PastilleCapsule";
export type { PastilleCapsuleProps, PastilleForm } from "./PastilleCapsule";
export { LeadDisc } from "./LeadDisc";
export { Segments, QualifierSegment, VariationChip, StockBadge } from "./PastilleBody";
export { entityChipModel } from "./entity-chip";
export type { EntityChipInput } from "./entity-chip";
export { arrangeSegments, leadFor, ROLE_ORDER, MAX_SEGMENTS, DEFAULT_LEAD_ICON, PERSON_LEAD_ICON } from "./capsule-model";
export type { PastilleRole, SegmentTone, SegmentInput, PastilleSegment, PastilleLead, Qualifier, QualifierTone, ItemStockBadge } from "./capsule-model";
export { EntityAvatar, initialsOf, initialsVariant } from "./entity-avatar";
export { formatPersonName, formatPersonNameOrNull } from "./person-name";
export { contrastRatio, legibleColor, tintedDiscBackground } from "./legible-color";
