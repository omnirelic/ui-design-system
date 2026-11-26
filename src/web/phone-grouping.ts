import { parseDeskPhone } from "./desk-countries";

/**
 * Numéro lisible pour l'admin (admin/lib/format-phone.ts de CLP) : « +237 690 00 00 11 » — 3 chiffres puis des paires ; un local camerounais
 * (9 chiffres) est préfixé +237. Autre forme : rendu tel quel. Ne sert qu'à un numéro DÉJÀ révélé à celui qui le lit (jamais dans une liste).
 */
export function formatPhoneGrouped(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  let dial: string;
  let national: string;
  if (s.startsWith("+")) {
    const p = parseDeskPhone(`+${digits}`);
    dial = p.country.dial;
    national = p.national;
  } else if (digits.length === 9) {
    dial = "237";
    national = digits;
  } else if (digits.startsWith("237") && digits.length === 12) {
    dial = "237";
    national = digits.slice(3);
  } else {
    return s;
  }
  const grouped = national.length > 3 ? `${national.slice(0, 3)} ${national.slice(3).replace(/(\d{2})(?=\d)/g, "$1 ")}` : national;
  return `+${dial} ${grouped}`;
}
