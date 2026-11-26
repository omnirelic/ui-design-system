// Clé canonique d'un numéro pour retrouver ou ouvrir son fil (admin/whatsapp/conversation-lookup.ts de Chez la Petite) : chiffres internationaux complets,
// miroir de `phoneKey` de son engine. `null` si le numéro n'est pas exploitable (masqué, trop court, mobile camerounais mal formé).
export function conversationPhoneKey(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  let digits = s.replace(/\D/g, "");
  if (!digits) return null;
  const international = s.startsWith("+");
  if (!international && digits.startsWith("00")) digits = digits.slice(2);
  if (!international && /^[26]\d{8}$/.test(digits)) return `237${digits}`;
  if (digits.startsWith("237")) return /^237[26]\d{8}$/.test(digits) ? digits : null;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
