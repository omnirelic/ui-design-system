// Sous-export `@omnirelic/ui-design-system/phone` : champ téléphone et utilitaires E.164 (libphonenumber-js, dépendance du consommateur).
export { PhoneInput } from "./PhoneInput";
export type { PhoneInputProps, PhoneChange } from "./PhoneInput";
export { DEFAULT_COUNTRY, displayPhone, flagOf, formatNational, isValidPhone, parseStoredPhone, phoneCountries, searchCountries, toE164 } from "./phone";
export type { PhoneCountry, PhoneParts, CountryCode } from "./phone";

// Champ numéro de Chez la Petite repris tel quel (pays + saisie brute tenus par le parent, E.164 via `resolvePhone`), à côté de `PhoneInput`.
export { PhoneField } from "./PhoneField";
export type { PhoneFieldProps } from "./PhoneField";
export { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, filterCountries, resolvePhone } from "./phone-intl";
export type { PhoneCountry as IntlPhoneCountry } from "./phone-intl";
