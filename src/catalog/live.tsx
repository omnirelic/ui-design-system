// Aides de rendu des exemples. Aucun réseau, aucune horloge.
import { useState, type ReactNode } from "react";

export const noop = (): void => {};
export const choices = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

/** Valeur saisissable : l'exemple se manipule vraiment. */
export function Controlled<T>({ initial, children }: { initial: T; children: (value: T, set: (v: T) => void) => ReactNode }) {
  const [value, setValue] = useState(initial);
  return <>{children(value, setValue)}</>;
}

/** Zone qui contient les éléments `position: fixed` (modale, toast) dans la carte. */
export function Contained({ height = 200, children }: { height?: number; children: ReactNode }) {
  return <div style={{ position: "relative", transform: "translateZ(0)", height, overflow: "hidden" }}>{children}</div>;
}

export function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <span style={{ width: 24, height: 24, borderRadius: 6, background: value, border: "1px solid rgba(128,128,128,.4)", flexShrink: 0 }} />
      <span>{name}</span>
      <code style={{ opacity: 0.7 }}>{value}</code>
    </div>
  );
}

export function SwatchList({ values }: { values: Record<string, string> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {Object.entries(values).map(([k, v]) => (
        <Swatch key={k} name={k} value={v} />
      ))}
    </div>
  );
}
