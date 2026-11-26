// Rangée d'onglets/filtres (mockup: .filter-row/.filter-chip) — utilisé pour
// les sous-onglets Business (Commission/Modèle QR/Livraison) et les filtres
// de période (Semaine/Mois/Année).
import { Reactive } from "./Reactive";
import { CARD, BORDER, DIM, ACCENT, FONT } from "./theme";
import { radius } from "../tokens";

export type TabItem = { key: string; label: string };

export type TabsProps = { items: TabItem[]; value: string; onChange: (key: string) => void };

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Reactive
            key={item.key}
            variant="chip"
            onClick={() => onChange(item.key)}
            style={{
              flex: 1, textAlign: "center", padding: "9px 6px", background: active ? "#0f1a19" : CARD,
              border: `1px solid ${active ? ACCENT : BORDER}`, borderRadius: radius.md, fontSize: FONT.label, fontWeight: 700,
              color: active ? ACCENT : DIM, cursor: "pointer",
            }}
          >
            {item.label}
          </Reactive>
        );
      })}
    </div>
  );
}
