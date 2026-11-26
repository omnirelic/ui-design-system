// Le numéro d'un client (ou d'un contact), TOUJOURS masqué (« +237 ORANGE 11 ») : pastille qui ouvre sa conversation DANS l'application (web/src/admin/ui/entity/PhoneRef.tsx
// de Chez la Petite) — ni lien d'appel ni lien WhatsApp externe. Numéro inexploitable pour une conversation : du texte, rien à ouvrir ; sans numéro : rien.
// Ni copie ni révélation ici : l'id du profil se copie depuis la pastille de l'utilisateur. L'ouverture est injectée (`onOpen`) : CLP câble `useOpenConversation`.
import { Icon } from "./Icon";
import { MaskedPhone } from "./MaskedPhone";
import { RefText } from "./entity-text";
import { conversationPhoneKey } from "./conversation-key";
import { maskPhoneText } from "./phone-mask";
import "./phone-css";

export interface PhoneRefOpenTarget { phone: string | null | undefined; profileId?: string | null; orderId?: string | null }

export interface PhoneRefProps {
  phone: string | null | undefined;
  /** Id du profil : ouvre le fil sans numéro. */
  profileId?: string | null;
  /** Commande à laquelle filtrer le fil. */
  orderId?: string | null;
  /** Ouvre la conversation ; sans lui, le numéro reste du texte. */
  onOpen?: (target: PhoneRefOpenTarget) => void;
  /** Drapeau à la place de l'indicatif (défaut : oui). */
  flag?: boolean;
}

export function PhoneRef({ phone, profileId, orderId, onOpen, flag }: PhoneRefProps) {
  const shown = maskPhoneText(phone);
  if (!shown) return null;
  if (!onOpen || (!profileId && !conversationPhoneKey(phone))) return <RefText variant="small" tone="muted"><MaskedPhone phone={phone} flag={flag} /></RefText>;
  return (
    <span className="omni-phone">
      <button type="button" className="omni-phone-main" aria-label="Ouvrir la conversation" onClick={() => onOpen({ phone, profileId, orderId })}>
        <Icon name="action-chat" size={16} />
        <RefText variant="small" strong><MaskedPhone phone={phone} profileId={profileId} flag={flag} /></RefText>
        <span className="omni-phone-tag"><RefText variant="caption" tone="muted">Conversation</RefText></span>
        <Icon name="ui-chevron-right" size={12} />
      </button>
    </span>
  );
}
