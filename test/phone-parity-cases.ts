// Jeu de cas COMMUN : exécuté côté client (resolvePhone, phone-intl.test.ts) et côté serveur
// (normalizeDeclaredPhone, api/__tests__/phone-parity.test.ts). Toute évolution de la règle se fait ici.
// `clientOnly` : saisie confortable acceptée par le formulaire seulement (le client envoie toujours un E.164 ou 9 chiffres).
export interface PhoneCase { input: string; e164: string | null; clientOnly?: boolean }

export const PHONE_CASES: PhoneCase[] = [
  { input: "699123456", e164: "+237699123456" },
  { input: "6 99 12 34 56", e164: "+237699123456" },
  { input: "+237699123456", e164: "+237699123456" },
  { input: "+237 699 12 34 56", e164: "+237699123456" },
  { input: "00237699123456", e164: "+237699123456" },
  { input: "+33612345678", e164: "+33612345678" },
  { input: "0033 6 12 34 56 78", e164: "+33612345678" },
  // Ancien numéro camerounais à 8 chiffres (23790397489) : ni accepté ni réparé en 237690397489.
  { input: "+23790397489", e164: null },
  { input: "23790397489", e164: null },
  { input: "90397489", e164: null },
  { input: "237699123456", e164: null },
  { input: "12", e164: null },
  { input: "12ab", e164: null },
  { input: "", e164: null },
  { input: "+99912", e164: null },
  { input: "0699123456", e164: "+237699123456", clientOnly: true },
];
