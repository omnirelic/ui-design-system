if (!superadmin) return <>{children}</>;// Numéro masqué à l'écran (web/src/admin/ui/entity/MaskedPhone.tsx de Chez la Petite) : le drapeau du pays remplace l'indicatif (« +237 »), puis l'opérateur
// (ORANGE, MTN, INCONNU) et les 2 derniers chiffres. Ancien format du serveur : pas d'opérateur, les points restent. `flag` éteint : l'indicatif s'écrit comme avant
// (CLP : réglage `admin_phone_flag`, activé par défaut). Pour copier ou lire à haute voix : `maskPhoneText`.
// `profileId` (et `identifierId` pour un numéro précis du profil) : le SUPERADMIN voit le numéro en clair au survol ou au focus (un appel par survol, journalisé côté
// serveur) ; tout autre rôle, ou sans profil : strictement le rendu masqué, aucun appel. Copier le numéro affiché (sélection + copier) : le superadmin reçoit le numéro
// en clair (`fetchPhoneFor("copy")`), les autres le texte masqué. Le numéro en clair n'est jamais dans le DOM une fois la bulle fermée.
import { useState, type ClipboardEvent, type ReactNode } from "react";
import { CountryFlag } from "./CountryFlag";
import { FloatingTooltip } from "./FloatingTooltip";
import { maskPhoneText, maskedPhoneParts } from "./phone-mask";
import { usePhoneReveal } from "./phone-reveal";
import { writeClipboard } from "./useCopied";
import "./phone-css";

export interface MaskedPhoneProps {
  phone: string | null | undefined;
  /** Profil du contact : ouvre la révélation superadmin au survol. */
  profileId?: string | null;
  /** Un numéro précis du profil. */
  identifierId?: string | null;
  /** Drapeau à la place de l'indicatif (défaut : oui). */
  flag?: boolean;
}

export function MaskedPhone({ phone, profileId, identifierId, flag = true }: MaskedPhoneProps) {
  const view = <MaskedView phone={phone} flag={flag} />;
  return profileId && maskedPhoneParts(phone) ? <RevealOnHover profileId={profileId} identifierId={identifierId}>{view}</RevealOnHover> : view;
}

function RevealOnHover({ profileId, identifierId, children }: { profileId: string; identifierId?: string | null; children: ReactNode }) {
  const reveal = usePhoneReveal();
  const superadmin = reveal.useViewerIsSuperadmin();
  const [open, setOpen] = useState(false);
  const [clear, setClear] = useState<string | null>(null);
  
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) { setClear(null); return; } // le numéro ne reste pas dans le DOM une fois la bulle fermée
    void reveal.revealPhone(profileId, identifierId).then(setClear);
  };
  // Copier le numéro affiché : le superadmin reçoit le numéro en clair, jamais le texte masqué. Révélé à l'instant de la copie (journalisé « copy », jamais gardé) ;
  // si la révélation échoue, rien n'est copié plutôt que le masqué.
  const onCopy = (e: ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    void writeClipboard(reveal.fetchPhoneFor("copy", profileId, identifierId).then((p) => p ?? Promise.reject(new Error("refusé"))));
  };
  return (
    <FloatingTooltip open={open} onOpenChange={onOpenChange} skip={() => clear === null} content={clear} style={{ display: "inline" }}>
      <span tabIndex={0} onCopy={onCopy}>{children}</span>
    </FloatingTooltip>
  );
}

function MaskedView({ phone, flag }: { phone: string | null | undefined; flag: boolean }) {
  const p = maskedPhoneParts(phone);
  if (!p) return null;
  if (!flag) return <span className="omni-masked-phone">{maskPhoneText(phone)}</span>;
  return (
    <span className="omni-masked-phone">
      <CountryFlag dial={p.dial} />
      {p.operator ? (
        <>
          <span className={`omni-masked-op omni-masked-op--${p.operator.toLowerCase()}`}>{p.operator}</span>
          <span>{p.last}</span>
        </>
      ) : <span>{p.national}</span>}
    </span>
  );
}
