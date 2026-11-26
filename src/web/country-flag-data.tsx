// Drapeaux dessinés à la main (web/src/ui/flags/CountryFlag.tsx de Chez la Petite) pour les pays les plus fréquents de la liste du bureau de commande : 3:2, viewBox 30x20.
// Les couleurs sont CELLES DES DRAPEAUX, des données comme `phone-flags.ts` : hors de la règle « jeton de thème seulement » (voir test/masked-phone-tokens.rules.test.ts).
import type { ReactNode } from "react";

export interface FlagDef { name: string; paint: ReactNode }

const stripes = (colors: string[], vertical: boolean): ReactNode => {
  const size = (vertical ? 30 : 20) / colors.length;
  return colors.map((fill, i) => (vertical ? <rect key={i} x={i * size} width={size + 0.2} height="20" fill={fill} /> : <rect key={i} y={i * size} width="30" height={size + 0.2} fill={fill} />));
};

const STAR = "M15.00,5.80 L16.09,8.90 L19.37,8.98 L16.76,10.97 L17.70,14.12 L15.00,12.25 L12.30,14.12 L13.24,10.97 L10.63,8.98 L13.91,8.90Z";

const FLAGS: Record<string, FlagDef> = {
  "237": { name: "Cameroun", paint: <><rect width="10" height="20" fill="#007A5E" /><rect x="10" width="10" height="20" fill="#CE1126" /><rect x="20" width="10" height="20" fill="#FCD116" /><path fill="#FCD116" d={STAR} /></> },
  "33": { name: "France", paint: stripes(["#0055A4", "#FFFFFF", "#EF4135"], true) },
  "32": { name: "Belgique", paint: stripes(["#000000", "#FAE042", "#ED2939"], true) },
  "41": { name: "Suisse", paint: <><rect width="30" height="20" fill="#DA291C" /><rect x="13" y="4.5" width="4" height="11" fill="#FFFFFF" /><rect x="9.5" y="8" width="11" height="4" fill="#FFFFFF" /></> },
  "225": { name: "Côte d'Ivoire", paint: stripes(["#F77F00", "#FFFFFF", "#009E60"], true) },
  "221": { name: "Sénégal", paint: <>{stripes(["#00853F", "#FDEF42", "#E31B23"], true)}<path fill="#00853F" d={STAR} /></> },
  "241": { name: "Gabon", paint: stripes(["#009E60", "#FCD116", "#3A75C4"], false) },
  "242": { name: "Congo", paint: <><polygon points="0,0 18,0 0,12" fill="#009543" /><polygon points="18,0 30,0 30,8 12,20 0,20 0,12" fill="#FBDE4A" /><polygon points="30,8 30,20 12,20" fill="#DC241F" /></> },
  "243": { name: "RD Congo", paint: <><rect width="30" height="20" fill="#007FFF" /><line x1="-2" y1="22" x2="32" y2="-2" stroke="#F7D618" strokeWidth="5.5" /><line x1="-2" y1="22" x2="32" y2="-2" stroke="#CE1021" strokeWidth="3.4" /><path fill="#F7D618" transform="translate(-9.6 -4.2) scale(.7)" d={STAR} /></> },
  "234": { name: "Nigeria", paint: stripes(["#008751", "#FFFFFF", "#008751"], true) },
  "44": { name: "Royaume-Uni", paint: <><rect width="30" height="20" fill="#012169" /><path d="M0 0L30 20M30 0L0 20" stroke="#FFFFFF" strokeWidth="3.6" /><path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" /><rect x="12" width="6" height="20" fill="#FFFFFF" /><rect y="7" width="30" height="6" fill="#FFFFFF" /><rect x="13.1" width="3.8" height="20" fill="#C8102E" /><rect y="8.1" width="30" height="3.8" fill="#C8102E" /></> },
  "49": { name: "Allemagne", paint: stripes(["#000000", "#DD0000", "#FFCE00"], false) },
  "34": { name: "Espagne", paint: <><rect width="30" height="20" fill="#AA151B" /><rect y="5" width="30" height="10" fill="#F1BF00" /></> },
  "39": { name: "Italie", paint: stripes(["#009246", "#FFFFFF", "#CE2B37"], true) },
};


export const COUNTRY_FLAGS: Record<string, FlagDef> = FLAGS;
