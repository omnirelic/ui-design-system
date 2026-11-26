// Sous-export `@omnirelic/ui-design-system/masked-phone` : numéro masqué de Chez la Petite (règle « zéro numéro en clair »), drapeau d'un indicatif, pastille de numéro,
// révélation par rôle, recherche par numéro. Aucune dépendance de libphonenumber : indépendant de `/phone`.
export { MaskedPhone } from "./MaskedPhone";
export type { MaskedPhoneProps } from "./MaskedPhone";
export { PhoneRef } from "./PhoneRef";
export type { PhoneRefProps, PhoneRefOpenTarget } from "./PhoneRef";
export { CountryFlag, FLAG_DIALS } from "./CountryFlag";
export { FloatingTooltip, Z_TOOLTIP } from "./FloatingTooltip";
export type { FloatingTooltipProps } from "./FloatingTooltip";
export { CLP_MTN_PREFIXES, CLP_ORANGE_PREFIXES, detectAdminMobileOperator, isMaskedPhoneText, maskedPhoneParts, maskPhoneText } from "./phone-mask";
export type { MaskedPhonePartsInterface, PhoneOperatorType } from "./phone-mask";
export { DESK_COUNTRIES, DESK_DEFAULT_COUNTRY, DESK_DIAL_CODES, buildDeskPhone, isValidDeskPhone, parseDeskPhone, searchDeskCountries } from "./desk-countries";
export type { DeskCountryInterface } from "./desk-countries";
export { formatPhoneGrouped } from "./phone-grouping";
export { conversationPhoneKey } from "./conversation-key";
export { adminRoles, canRevealPhone, hasAnyRole, phoneRank } from "./phone-rank";
export type { AdminRolesInterface, PhoneRankType, PhoneRevealPurposeType } from "./phone-rank";
export { phoneActions } from "./phone-actions";
export type { PhoneAction, PhoneActionId } from "./phone-actions";
export { PhoneAccessRequired, PhoneRevealProvider, createPhoneReveal, usePhoneReveal } from "./phone-reveal";
export type { PhoneReveal, PhoneRevealOptions, PhoneRevealTransport } from "./phone-reveal";
export { PHONE_SEARCH_MIN_DIGITS, isShortPhoneTerm, phoneSearchTermDigits } from "./phone-search";
export { PhoneSearchNotice, PhoneSearchProvider, usePhoneMatch, usePhoneSearchStatus } from "./phone-search-status";
export type { PhoneSearchKind, PhoneSearchStatus, PhoneSearchTransport } from "./phone-search-status";
