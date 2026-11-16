// Sous-export `@omnirelic/ui-design-system/phone` : champ téléphone et utilitaires E.164 (libphonenumber-js, dépendance du consommateur).
export { PhoneInput } from "./PhoneInput";
export type { PhoneInputProps, PhoneChange } from "./PhoneInput";
export { DEFAULT_COUNTRY, displayPhone, flagOf, formatNational, isValidPhone, parseStoredPhone, phoneCountries, searchCountries, toE164 } from "./phone";
export type { PhoneCountry, PhoneParts, CountryCode } from "./phone";
