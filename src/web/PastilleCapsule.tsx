// LA pastille d'entité de CLP (web/src/admin/ui/pastille/PastilleCapsule.tsx), dans ses trois tailles. Purement visuelle : le clic, le survol et les actions viennent de l'entité qui l'emploie.
// Elle se compacte seule selon la largeur du conteneur (`<PastilleBox>`), par requêtes de conteneur — aucun JavaScript.
// Aucune infobulle (le texte est déjà à l'écran, le reste est dans la fiche rapide au survol) — sauf la forme « point », qui n'a aucun texte.
import type { ReactNode } from "react";
import { RefText } from "./entity-text";
import { QualifierSegment, Segments } from "./PastilleBody";
import type { PastilleSegment, Qualifier } from "./capsule-model";
import "./entity-css";

export type PastilleForm = "pill" | "compact" | "point";

export interface PastilleCapsuleProps {
  /** Le disque de tête (`<LeadDisc>`) : une pastille non étendue en a TOUJOURS un. */
  lead: ReactNode;
  segments: readonly PastilleSegment[];
  /** Badge fusionné au bout de la pastille (« Nouveau », « Fidèle »…). */
  qualifier?: Qualifier;
  /** `pill` : tous les segments · `compact` : disque + libellé, bordure comprise · `point` : disque seul, point d'état sur sa circonférence. */
  form?: PastilleForm;
  /** `point` : couleur du point d'état. */
  stateDot?: string;
  /** Fond et contour d'accent (le décompte du client). */
  gold?: boolean;
  /** Devant le disque de tête, dans la capsule (la quantité d'un plat : « 2× »). */
  prefix?: ReactNode;
  /** Phrase complète lue par les lecteurs d'écran (« 1× Jus de Foléré, M, 7 restants »). */
  label?: string;
  /** Nom atténué (plat épuisé). */
  dim?: boolean;
}

export function PastilleCapsule({ lead, segments, qualifier, form = "pill", stateDot, gold, prefix, label: ariaLabel, dim }: PastilleCapsuleProps) {
  const label = segments.find(s => s.role === "label")?.text;
  if (form === "point") {
    return (
      <span className="omni-pst omni-pst--point" title={label}>
        {lead}
        {stateDot && <span aria-hidden className="omni-pst-dot" style={{ background: stateDot }} />}
      </span>
    );
  }
  if (form === "compact") {
    return <span className="omni-pst omni-pst--compact">{lead}{label && <RefText variant="small">{label}</RefText>}</span>;
  }
  return (
    <span className={`omni-pst${gold ? " omni-pst--gold" : ""}${dim ? " omni-pst--dim" : ""}`} role={ariaLabel ? "group" : undefined} aria-label={ariaLabel}>
      {prefix && <span className="omni-pst-pre">{prefix}</span>}
      {lead}
      <Segments segments={segments} />
      {qualifier && <QualifierSegment qualifier={qualifier} />}
    </span>
  );
}

/** Le conteneur dont la largeur décide du palier de compacité. À placer autour d'une pastille dans une vue en bloc ; sans lui, la pastille reste à sa taille pleine. */
export function PastilleBox({ children }: { children: ReactNode }) {
  return <span className="omni-pst-box">{children}</span>;
}
