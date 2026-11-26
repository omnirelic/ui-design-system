// Drapeau d'un pays à partir de son indicatif (« +33 »), en SVG 3:2 (web/src/ui/flags/CountryFlag.tsx de Chez la Petite) : un emoji drapeau ne s'affiche pas partout
// (Windows). Drapeaux dessinés à la main pour les pays les plus fréquents de la liste du bureau ; un autre indicatif donne un globe neutre. « +1 » (États-Unis,
// Canada…) est partagé par plusieurs pays et un numéro masqué n'en dit pas plus : globe, jamais un drapeau qui pourrait mentir. Le Cameroun passe par la même
// voie que les autres (CLP a un composant à part, au rendu identique).
import { COUNTRY_FLAGS } from "./country-flag-data";
import { Icon } from "./Icon";
import { BORDER, DIM } from "./theme";

/** Les indicatifs dont on sait dessiner le drapeau (hors Cameroun, que CLP traite à part). */
export const FLAG_DIALS: string[] = Object.keys(COUNTRY_FLAGS).filter((d) => d !== "237");

const digits = (dial: string): string => dial.replace(/\D/g, "");

/** Drapeau de l'indicatif donné (« +33 » ou « 33 ») ; globe neutre pour un indicatif sans drapeau dessiné. Rien sans indicatif. */
export function CountryFlag({ dial, height = 14 }: { dial: string; height?: number }) {
  const d = digits(dial);
  if (!d) return null;
  const flag = COUNTRY_FLAGS[d];
  if (!flag) return <Icon name="ui-globe" size={height} color={DIM} />;
  const id = `omni-flag-${d}`;
  return (
    <svg className="omni-flag" role="img" aria-label={flag.name} width={Math.round(height * 1.5)} height={height} viewBox="0 0 30 20" style={{ flexShrink: 0 }}>
      <defs><clipPath id={id}><rect width="30" height="20" rx="2.5" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{flag.paint}</g>
      <rect x=".5" y=".5" width="29" height="19" rx="2" fill="none" stroke={BORDER} />
    </svg>
  );
}
