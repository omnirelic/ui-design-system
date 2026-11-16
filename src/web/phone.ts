// Numéros de téléphone : identité réseau = E.164 (+237641785415). Pur, sans React.
// Lecture tolérante : un numéro déjà stocké sans indicatif (« 641785415 », 9 chiffres camerounais) s'ouvre comme +237 641785415 —
// la migration est faite à la lecture, jamais par écriture de masse.
import { AsYouType, getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

export const DEFAULT_COUNTRY: CountryCode = "CM";
export type { CountryCode };

export interface PhoneCountry { code: CountryCode; name: string; dial: string; flag: string }

/** Drapeau d'un pays, construit depuis ses deux lettres (indicateurs régionaux Unicode). */
export const flagOf = (code: string): string => String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0)));

let cache: PhoneCountry[] | null = null;
/** Pays du réseau, triés par nom français, Cameroun en tête. */
export function phoneCountries(): PhoneCountry[] {
  if (cache) return cache;
  const names = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;
  const all = getCountries().map(code => ({ code, name: names?.of(code) ?? code, dial: `+${getCountryCallingCode(code)}`, flag: flagOf(code) }));
  all.sort((a, b) => (a.code === DEFAULT_COUNTRY ? -1 : b.code === DEFAULT_COUNTRY ? 1 : a.name.localeCompare(b.name, "fr")));
  return (cache = all);
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’]/g, "'").toLowerCase();
/** Recherche par nom (sans accent ni casse), indicatif (« 237 », « +237 ») ou code pays. */
export function searchCountries(list: PhoneCountry[], query: string): PhoneCountry[] {
  const q = fold(query.trim()).replace(/^\+/, "");
  if (!q) return list;
  return list.filter(c => fold(c.name).includes(q) || c.dial.slice(1).startsWith(q) || c.code.toLowerCase() === q);
}

export interface PhoneParts { country: CountryCode; national: string }

/** Décompose une valeur stockée : E.164, ou numéro national sans indicatif (lu comme celui du pays par défaut), ou vide. */
export function parseStoredPhone(stored: string | null | undefined, fallback: CountryCode = DEFAULT_COUNTRY): PhoneParts {
  const raw = (stored ?? "").trim();
  if (!raw) return { country: fallback, national: "" };
  const hasPlus = raw.startsWith("+") || raw.startsWith("00");
  const p = parsePhoneNumberFromString(hasPlus ? raw.replace(/^00/, "+") : raw, fallback);
  if (p?.country) return { country: p.country, national: p.nationalNumber };
  // Ancien format camerounais sans « + » mais avec l'indicatif (237641785415).
  const digits = raw.replace(/\D/g, "");
  const dial = String(getCountryCallingCode(fallback));
  return { country: fallback, national: digits.startsWith(dial) && digits.length > dial.length + 5 ? digits.slice(dial.length) : digits };
}

/** E.164 de la saisie (« +237641785415 ») ; chaîne vide si aucun chiffre. Valable ou non : `isValidPhone` tranche. */
export const toE164 = (country: CountryCode, national: string): string => {
  const digits = national.replace(/\D/g, "");
  return digits ? `+${getCountryCallingCode(country)}${digits}` : "";
};

export const isValidPhone = (country: CountryCode, national: string): boolean => national.trim() !== "" && isValidPhoneNumber(toE164(country, national));

/** Saisie mise en forme à la frappe pour le pays (ex. CM : « 6 41 78 54 15 »). */
export const formatNational = (country: CountryCode, national: string): string => new AsYouType(country).input(national.replace(/\D/g, ""));

/** Affichage d'un numéro stocké : « +237 6 41 78 54 15 » (international), ou la valeur telle quelle si illisible. */
export function displayPhone(stored: string | null | undefined, fallback: CountryCode = DEFAULT_COUNTRY): string {
  const raw = (stored ?? "").trim();
  if (!raw) return "";
  const { country, national } = parseStoredPhone(raw, fallback);
  return parsePhoneNumberFromString(toE164(country, national))?.formatInternational() ?? raw;
}
