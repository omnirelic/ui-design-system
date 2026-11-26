// Pays du bureau de commande de Chez la Petite (admin/order-desk/desk-countries.ts) : 60 pays, indicatif, recherche, découpe d'un numéro
// « +indicatif… ». C'est la liste que l'affichage masqué (admin-phone-mask.ts) et le groupement (phone-grouping.ts) lisent ; elle diffère
// de `international-e164` (48 pays, libphonenumber) : on ne les fusionne pas, ce sont deux contrats.
// Stockage rétro-compatible de CLP : Cameroun = 9 chiffres nationaux, autre pays = « +indicatif+numéro ».

export interface DeskCountryInterface { iso: string; name: string; dial: string }

const RAW: [string, string, string][] = [
  ["CM", "Cameroun", "237"], ["FR", "France", "33"], ["CI", "Côte d'Ivoire", "225"], ["SN", "Sénégal", "221"],
  ["GA", "Gabon", "241"], ["CG", "Congo", "242"], ["CD", "RD Congo", "243"], ["TD", "Tchad", "235"],
  ["CF", "Centrafrique", "236"], ["GQ", "Guinée équatoriale", "240"], ["NG", "Nigeria", "234"], ["GH", "Ghana", "233"],
  ["BJ", "Bénin", "229"], ["TG", "Togo", "228"], ["BF", "Burkina Faso", "226"], ["ML", "Mali", "223"],
  ["NE", "Niger", "227"], ["GN", "Guinée", "224"], ["MA", "Maroc", "212"], ["DZ", "Algérie", "213"],
  ["TN", "Tunisie", "216"], ["EG", "Égypte", "20"], ["ZA", "Afrique du Sud", "27"], ["KE", "Kenya", "254"],
  ["RW", "Rwanda", "250"], ["BI", "Burundi", "257"], ["AO", "Angola", "244"], ["MG", "Madagascar", "261"],
  ["MU", "Maurice", "230"], ["CV", "Cap-Vert", "238"], ["ST", "Sao Tomé-et-Principe", "239"], ["DJ", "Djibouti", "253"],
  ["BE", "Belgique", "32"], ["CH", "Suisse", "41"], ["LU", "Luxembourg", "352"], ["DE", "Allemagne", "49"],
  ["GB", "Royaume-Uni", "44"], ["IE", "Irlande", "353"], ["ES", "Espagne", "34"], ["PT", "Portugal", "351"],
  ["IT", "Italie", "39"], ["NL", "Pays-Bas", "31"], ["SE", "Suède", "46"], ["NO", "Norvège", "47"],
  ["DK", "Danemark", "45"], ["PL", "Pologne", "48"], ["RU", "Russie", "7"], ["TR", "Turquie", "90"],
  ["US", "États-Unis", "1"], ["CA", "Canada", "1"], ["MX", "Mexique", "52"], ["BR", "Brésil", "55"],
  ["HT", "Haïti", "509"], ["AE", "Émirats arabes unis", "971"], ["SA", "Arabie saoudite", "966"], ["LB", "Liban", "961"],
  ["IN", "Inde", "91"], ["CN", "Chine", "86"], ["JP", "Japon", "81"], ["AU", "Australie", "61"],
];

export const DESK_COUNTRIES: readonly DeskCountryInterface[] = RAW.map(([iso, name, dial]) => ({ iso, name, dial }));
export const DESK_DEFAULT_COUNTRY: DeskCountryInterface = DESK_COUNTRIES[0] as DeskCountryInterface;

const fold = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const digitsOf = (s: string): string => s.replace(/\D/g, "");

/** Indicatifs, le plus long d'abord (« 237 » avant « 2… ») ; « 1 » est partagé US/CA, le premier de la liste gagne. */
export const DESK_DIAL_CODES: readonly string[] = [...DESK_COUNTRIES].map((c) => c.dial).sort((a, b) => b.length - a.length);

export function searchDeskCountries(query: string, limit = 8): DeskCountryInterface[] {
  const q = fold(query);
  if (!q) return DESK_COUNTRIES.slice(0, limit);
  const dial = /^\+?\d+$/.test(q) ? digitsOf(q) : null;
  const hits = DESK_COUNTRIES.filter((c) => (dial ? c.dial.startsWith(dial) : fold(c.name).includes(q) || c.iso.toLowerCase() === q));
  const rank = (c: DeskCountryInterface): number => (dial ? (c.dial === dial ? 0 : 1) : fold(c.name).startsWith(q) || c.iso.toLowerCase() === q ? 0 : 1);
  return hits.sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

export function buildDeskPhone(country: DeskCountryInterface, national: string): string {
  const n = digitsOf(national).replace(/^0+/, "");
  return country.iso === "CM" ? n.slice(-9) : `+${country.dial}${n}`;
}

export function parseDeskPhone(stored: string): { country: DeskCountryInterface; national: string } {
  if (!stored.startsWith("+")) return { country: DESK_DEFAULT_COUNTRY, national: stored };
  const d = digitsOf(stored);
  const country = [...DESK_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => d.startsWith(c.dial));
  return country ? { country, national: d.slice(country.dial.length) } : { country: DESK_DEFAULT_COUNTRY, national: d };
}

export function isValidDeskPhone(country: DeskCountryInterface, national: string): boolean {
  const n = digitsOf(national);
  return country.iso === "CM" ? n.length === 9 : n.length >= 6 && n.length <= 12;
}
