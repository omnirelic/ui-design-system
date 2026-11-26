// Champ « photo de preuve » des modales d'action (web/src/admin/ui/ProofField.tsx de CLP) : bouton pointillé, puis miniature + « Remplacer » (jamais l'image à 40 % de la hauteur d'écran)
// + corbeille. La miniature ouvre l'image en grand. Toute la zone reçoit une image glissée ou collée (Ctrl/⌘ V), pas seulement le bouton.
// États : vide, envoi (« Envoi… », curseur d'attente, champ désactivé), photo prête, erreur. L'envoi lui-même est celui du parent (`onPick`, voir `useProofUpload`).
// Écart : la corbeille porte `title` + `aria-label` « Retirer l'image » (icône seule) au lieu de l'infobulle flottante de CLP.
import { useRef } from "react";
import { Icon } from "./Icon";
import { ControlButton, tint } from "./controls";
import { RefText } from "./entity-text";
import { FileInput } from "./FileInput";
import { PhotoThumb } from "./PhotoThumb";
import { PhotoLink } from "./PhotoLink";
import { ACCENT, BORDER, DIM, MONO, TXT, rem } from "./theme";

export interface ProofFieldProps {
  url: string | null;
  uploading: boolean;
  error: string;
  onPick: (file: File | undefined) => void;
  /** Libellé du bouton tant qu'aucune photo n'est choisie. */
  addLabel: string;
  /** Libellé de la ligne « photo prête » (ex. « Preuve envoyée par le client »). */
  doneLabel?: string;
  /** Aide courte sous le bouton quand rien n'est choisi. */
  tip?: string;
  /** Retire l'image choisie (corbeille à côté de « Remplacer »). Absent : l'image ne peut que se remplacer. */
  clear?: () => void;
}

export function ProofField({ url, uploading, error, onPick, addLabel, doneLabel = "Photo ajoutée", tip, clear }: ProofFieldProps) {
  const root = useRef<HTMLDivElement>(null);
  const picker = (label: string, plain: boolean) => (
    <label style={{ fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: uploading ? "wait" : "pointer",
      ...(plain ? { marginLeft: "auto", color: TXT, textDecoration: "underline" } : { padding: `${rem(12)} 0`, border: `1px dashed ${BORDER}`, borderRadius: rem(8), color: TXT }) }}>
      {!plain && <Icon name="ui-image" size={15} color={DIM} />}
      <RefText variant={plain ? "caption" : "small"} color={TXT}>{uploading ? "Envoi…" : label}</RefText>
      {!plain && !uploading && <RefText variant="caption" tone="muted">· glisser ou coller</RefText>}
      <FileInput dropTarget={root} accept="image/*" disabled={uploading} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
    </label>
  );
  return (
    <div ref={root} style={{ borderRadius: rem(8) }}>
      {url ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, border: `1px solid ${tint(ACCENT, 33)}`, borderRadius: rem(8) }}>
          <PhotoLink url={url}><PhotoThumb src={url} alt="preuve" size={56} /></PhotoLink>
          <RefText variant="caption" tone="muted">{doneLabel}</RefText>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: rem(8) }}>
            {picker("Remplacer", true)}
            {clear && <ControlButton size="sm" variant="ghost" title="Retirer l'image" aria-label="Retirer l'image" icon={<Icon name="action-delete" size={14} />} onClick={clear} />}
          </span>
        </div>
      ) : picker(addLabel, false)}
      {!url && tip && <div style={{ marginTop: 6 }}><RefText variant="caption" tone="muted">{tip}</RefText></div>}
      {error && <div style={{ marginTop: 6 }}><RefText variant="caption" tone="danger">{error}</RefText></div>}
    </div>
  );
}
