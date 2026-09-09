import type { InputHTMLAttributes, ReactNode } from "react";
import { ACCENT, TXT, FONT } from "./theme";

export type CheckboxProps = { label: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ label, style, ...rest }: CheckboxProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: FONT.base, fontWeight: 600, color: TXT, cursor: "pointer" }}>
      <input type="checkbox" style={{ accentColor: ACCENT, width: 16, height: 16, flexShrink: 0, ...style }} {...rest} />
      {label}
    </label>
  );
}
