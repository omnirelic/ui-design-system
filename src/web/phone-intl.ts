// Reprise TELLE QUELLE de Chez la Petite (web/src/account/phone-intl.ts, CLP gelé) : liste de 25 pays, filtre, normalisation E.164.
// Aide à la saisie, pas une autorité : le serveur revalide (kit : parseInternationalPhone). Règle Cameroun stricte (mobile 6XXXXXXXX) :
// un ancien numéro à 8 chiffres n'est jamais réparé (spec omnirelic/engine#105). Distinct de ./phone.ts (libphonenumber, E.164 par pays).

export interface PhoneCountry { iso: string; name: string; dial: string }

export const DEFAULT_PHONE_COUNTRY = "CM";

const RAW: PhoneCountry[] = [
  { iso: "DE", name: "Allemagne", dial: "49" },
  { iso: "BE", name: "Belgique", dial: "32" },
  { iso: "BJ", name: "Bénin", dial: "229" },
  { iso: "BF", name: "Burkina Faso", dial: "226" },
  { iso: "CM", name: "Cameroun", dial: "237" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "CF", name: "Centrafrique", dial: "236" },
  { iso: "CG", name: "Congo", dial: "242" },
  { iso: "CD", name: "Congo (RDC)", dial: "243" },
  { iso: "CI", name: "Côte d'Ivoire", dial: "225" },
  { iso: "US", name: "États-Unis", dial: "1" },
  { iso: "FR", name: "France", dial: "33" },
  { iso: "GA", name: "Gabon", dial: "241" },
  { iso: "GN", name: "Guinée", dial: "224" },
  { iso: "GQ", name: "Guinée équatoriale", dial: "240" },
  { iso: "ML", name: "Mali", dial: "223" },
  { iso: "MA", name: "Maroc", dial: "212" },
  { iso: "NE", name: "Niger", dial: "227" },
  { iso: "NG", name: "Nigeria", dial: "234" },
  { iso: "GB", name: "Royaume-Uni", dial: "44" },
  { iso: "SN", name: "Sénégal", dial: "221" },
  { iso: "CH", name: "Suisse", dial: "41" },
  { iso: "TD", name: "Tchad", dial: "235" },
  { iso: "TG", name: "Togo", dial: "228" },
  { iso: "TN", name: "Tunisie", dial: "216" },
];

export const PHONE_COUNTRIES: PhoneCountry[] = [...RAW].sort((a, b) => a.name.localeCompare(b.name, "fr"));

const fold = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtre par nom (sans accents/casse), indicatif (avec ou sans +) ou code ISO. */
export function filterCountries(list: PhoneCountry[], query: string): PhoneCountry[] {
  const q = fold(query.trim().replace(/^\+/, ""));
  if (!q) return list;
  return list.filter(c => fold(c.name).includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q);
}

// Indicatifs du plus long au plus court : « 243 » (RDC) doit gagner sur « 24x ».
const BY_DIAL_DESC = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

function nationalValid(country: PhoneCountry, national: string): boolean {
  // Cameroun : règle stricte historique (mobile 6XXXXXXXX). Ailleurs : 6–14 chiffres —
  // volontairement large, une regex par pays rejetterait des numéros réels.
  if (country.iso === "CM") return /^6\d{8}$/.test(national);
  return /^\d{6,14}$/.test(national);
}

/**
 * Résout la saisie : un numéro collé avec `+` ou `00` bascule le pays détecté ; sinon on
 * garde `selected`. Renvoie le pays effectif et le E.164 (`null` si invalide).
 */
export function resolvePhone(selected: PhoneCountry, raw: string): { country: PhoneCountry; e164: string | null } {
  const trimmed = raw.trim();
  let country = selected;
  let digits = trimmed.replace(/\D/g, "");
  if (/^(\+|00)/.test(trimmed)) {
    const all = trimmed.startsWith("00") ? digits.slice(2) : digits; // indicatif + numéro
    const hit = BY_DIAL_DESC.find(c => all.startsWith(c.dial));
    if (hit) { country = hit; digits = all.slice(hit.dial.length); }
    else digits = all;
  }
  const national = digits.replace(/^0+/, "");
  return { country, e164: nationalValid(country, national) ? `+${country.dial}${national}` : null };
}
