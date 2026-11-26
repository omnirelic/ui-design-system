// Segments, badge, variation et stock d'une pastille (web/src/admin/ui/pastille/PastilleBody.tsx de CLP).
import { Icon, type IconName } from "./Icon";
import { RefText, type TextTone } from "./entity-text";
import { defaultFormatMoney, useOptionalEntityRef } from "./entity-context";
import type { ItemStockBadge, PastilleSegment, Qualifier, SegmentTone } from "./capsule-model";
import "./entity-css";

const TEXT_TONE: Record<SegmentTone, TextTone> = { default: "default", muted: "muted", money: "success", gold: "accent", warn: "warning", bad: "danger" };

/** Les segments d'une pastille (le disque de tête et le conteneur sont au parent). Chaque segment porte sa position : les paliers de compacité s'y accrochent. */
export function Segments({ segments }: { segments: readonly PastilleSegment[] }) {
  const format = useOptionalEntityRef()?.formatMoney ?? defaultFormatMoney;
  return (
    <>
      {segments.map(s => (
        <span key={s.pos} className={`omni-pst-sg omni-pst-sg--${s.role}`} data-pos={s.pos}>
          {s.dot && <span aria-hidden className="omni-pst-sd" style={{ background: s.dot }} />}
          <RefText variant="small" tone={TEXT_TONE[s.tone]} strong={s.strong || s.tone === "money" || s.tone === "gold"}>
            {s.node ?? (s.money ? format(s.money.value, s.money.signed) : s.text)}
          </RefText>
          {s.after}
        </span>
      ))}
    </>
  );
}

/** Le badge : dernier segment, fusionné au bord de la pastille. Faute de place le mot part (`.omni-pst-ql`) : l'icône reste et le mot apparaît au survol (CSS, `data-label`) — jamais d'infobulle quand le mot est déjà lisible. */
export function QualifierSegment({ qualifier }: { qualifier: Qualifier }) {
  return (
    <span role="img" aria-label={qualifier.label} data-label={qualifier.label} className={`omni-pst-q omni-pst-q--${qualifier.tone}`}>
      <Icon name={qualifier.icon as IconName} size={14} weight="bold" />
      <span className="omni-pst-ql">{qualifier.label}</span>
    </span>
  );
}

/** La variation d'un plat : mini-puce bleue collée au nom (« M », « M (0,5 l) »). */
export function VariationChip({ label }: { label: string }) {
  return <span className="omni-pst-var">{label}</span>;
}

const STOCK_ARIA = (b: ItemStockBadge): string =>
  b.level === "made_to_order" ? "À la commande" : b.level === "out" ? "Épuisé" : `${b.level === "low" ? "Stock bas : " : ""}${b.count} restant${b.count > 1 ? "s" : ""}`;

/** Le stock d'un plat : le nombre seul (marmite pour un plat à la commande). */
export function StockBadge({ stock }: { stock: ItemStockBadge }) {
  return (
    <span role="img" aria-label={STOCK_ARIA(stock)} className={`omni-pst-stock omni-pst-stock--${stock.level}`}>
      {stock.level === "made_to_order" ? <Icon name="step-preparing" size={12} weight="bold" /> : <>{stock.derived && <Icon name="step-preparing" size={10} weight="bold" />}{stock.count}</>}
    </span>
  );
}
