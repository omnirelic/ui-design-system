// Numéro masqué de l'admin de Chez la Petite : « +237 ORANGE 11 » — l'indicatif (l'écran le remplace par le drapeau du pays), l'opérateur
// et les 2 derniers chiffres, jamais plus. Hors Cameroun, ou opérateur camerounais ni Orange ni MTN : « INCONNU ».
// Reprend web/src/admin/lib/mask-phone.ts de CLP (affichage et lecture d'un numéro déjà masqué) ; le masquage côté serveur (web/api/_lib/phone-mask.ts,
// engine/src/sms/phone-display.ts) est dans le kit d'omnirelic. Règle « zéro numéro en clair » de CLP
// (web#1599/#1631) : l'opérateur se lit sur le numéro COMPLET, donc le serveur le calcule et l'envoie dans la chaîne masquée ; l'écran ne peut
// pas le retrouver depuis un numéro déjà masqué, et ce module n'invente jamais un chiffre de plus.
// Table des préfixes d'opérateur : celle de CLP (admin). Elle diffère de `cameroonMobileNumber` (640 Orange ici ; 684 et 685 y sont MTN et Orange).
import { DESK_DIAL_CODES } from "./desk-countries";

const MASK = "•";
const KEPT = 2;
const UNKNOWN = "INCONNU";
const CAMEROON = "237";

export type PhoneOperatorType = "ORANGE" | "MTN" | typeof UNKNOWN;

export const CLP_ORANGE_PREFIXES: ReadonlySet<string> = new Set(["655", "656", "657", "658", "659", "690", "691", "692", "693", "694", "695", "696", "697", "698", "699", "686", "687", "688", "689", "640"]);
export const CLP_MTN_PREFIXES: ReadonlySet<string> = new Set(["670", "671", "672", "673", "674", "675", "676", "677", "678", "679", "650", "651", "652", "653", "654", "680", "681", "682", "683"]);

/** Opérateur d'un mobile camerounais d'après ses chiffres nationaux ; `null` sinon (Camtel, Nexttel, fixe, trop court). */
export function detectAdminMobileOperator(national: string): "ORANGE" | "MTN" | null {
  if (!national || national.length < 3) return null;
  const prefix = national.slice(0, 3);
  if (CLP_ORANGE_PREFIXES.has(prefix)) return "ORANGE";
  if (CLP_MTN_PREFIXES.has(prefix)) return "MTN";
  return null;
}

export interface MaskedPhonePartsInterface {
  /** Indicatif (« +237 »), vide s'il est inconnu : l'écran en fait un drapeau. */
  dial: string;
  /** Opérateur affiché ; `null` pour l'ancien format sans opérateur. */
  operator: PhoneOperatorType | null;
  /** Les 2 derniers chiffres. */
  last: string;
  /** Ce qui suit l'indicatif, en texte : « ORANGE 11 » (ancien format : « ••• •• •• 11 »). */
  national: string;
}

/** Déjà affiché par le serveur : « +237 ORANGE 11 », « +33 INCONNU 78 », « INCONNU 78 ». */
const DISPLAYED = /^(\+\d{1,3})?\s*(ORANGE|MTN|INCONNU)\s+(\d{1,2})$/;

/** Groupes identiques à `formatPhoneGrouped` : 3 caractères, puis des paires. */
const group = (national: string): string => (national.length > 3 ? `${national.slice(0, 3)} ${national.slice(3).replace(/(.{2})(?=.)/g, "$1 ")}` : national);

const hide = (national: string): string => {
  const kept = national.length <= KEPT ? 0 : KEPT;
  return MASK.repeat(national.length - kept) + national.slice(national.length - kept);
};

const parts = (dial: string, operator: PhoneOperatorType, last: string): MaskedPhonePartsInterface => ({ dial, operator, last, national: `${operator} ${last}` });

const splitDial = (digits: string): { dial: string; national: string } | null => {
  const dial = DESK_DIAL_CODES.find((d) => digits.startsWith(d));
  return dial ? { dial, national: digits.slice(dial.length) } : null;
};

/** Le numéro en trois morceaux (indicatif, opérateur, fin) pour afficher un drapeau à la place de l'indicatif. `null` sans numéro. */
export function maskedPhoneParts(raw: string | null | undefined): MaskedPhonePartsInterface | null {
  const s = (raw ?? "").trim().replace(/^tel:/, "");
  if (!s) return null;

  const shown = DISPLAYED.exec(s);
  if (shown) return parts(shown[1] ?? "", shown[2] as PhoneOperatorType, shown[3] ?? "");

  if (s.includes(MASK)) {
    // Ancien format du serveur, ou numéro dont des chiffres de tête restent lisibles.
    const dial = s.startsWith("+237") ? "+237" : "";
    const national = s.slice(dial.length).replace(/\s/g, "");
    const last = national.replace(/\D/g, "").slice(-KEPT);
    const lead = /^\d+/.exec(national)?.[0] ?? "";
    if (dial === "+237" && lead.length >= 3) return parts(dial, detectAdminMobileOperator(lead) ?? UNKNOWN, last);
    const hidden = hide(national);
    return { dial, operator: null, last, national: national.length === 9 ? group(hidden) : hidden }; // groupé seulement pour un numéro de 9 chiffres
  }

  const digits = s.replace(/\D/g, "");
  let split: { dial: string; national: string } | null = null;
  if (s.startsWith("+")) split = splitDial(digits);
  else if (/^237\d{9}$/.test(digits)) split = { dial: CAMEROON, national: digits.slice(3) };
  else if (/^[26]\d{8}$/.test(digits)) split = { dial: CAMEROON, national: digits }; // numéro camerounais local
  const last = digits.slice(-KEPT);
  if (!split) return parts("", UNKNOWN, last);
  const operator = split.dial === CAMEROON ? detectAdminMobileOperator(split.national) : null;
  return parts(`+${split.dial}`, operator ?? UNKNOWN, last);
}

/**
 * Cette chaîne EST-ELLE un numéro déjà masqué par le serveur (« +237 ORANGE 11 », « INCONNU 78 », ancien « +237•••••••11 ») ? Un nom de contact
 * vaut parfois ce numéro (contact sans nom) : l'écran l'affiche alors par le composant de numéro masqué. Un nom ordinaire : non.
 */
export function isMaskedPhoneText(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim();
  if (!s) return false;
  return DISPLAYED.test(s) || /^(\+\d{1,3})?[\s\d]*•[\s•\d]*\d{1,2}$/.test(s);
}

/** Numéro masqué en texte (copie, message d'assistance) : « +237 ORANGE 11 », l'indicatif écrit. Chaîne vide sans numéro. Idempotent. */
export function maskPhoneText(raw: string | null | undefined): string {
  const p = maskedPhoneParts(raw);
  return p ? `${p.dial} ${p.national}`.trim() : "";
}
