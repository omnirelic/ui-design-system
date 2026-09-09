// Champ de formulaire labellisé — label majuscule espacé au-dessus, input
// stylé en dessous (même forme que PayoutDestinationForm côté
// @omnirelic/components, jamais un input brut non stylé). `TextInput`
// exporté séparément pour composer un champ custom (ex. SearchableSelect)
// avec le même style d'input sans le label.
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { BG, BORDER, TXT, DIM2, ACCENT, FONT } from "./theme";
import { radius } from "../tokens";

export type FieldProps = { label: string; hint?: ReactNode; children: ReactNode };

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div style={{ textAlign: "left" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FONT.label, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM2, marginBottom: 6 }}>
        {label}
        {hint}
      </label>
      {children}
    </div>
  );
}

const inputBaseStyle = {
  width: "100%", height: 44, borderRadius: radius.md, border: `1px solid ${BORDER}`, background: BG, color: TXT,
  fontFamily: "inherit", fontSize: FONT.base, fontWeight: 600, padding: "0 12px", outline: "none",
} as const;

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ style, onFocus, onBlur, ...rest }, ref) {
  return (
    <input
      ref={ref}
      style={{ ...inputBaseStyle, ...style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT; onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; onBlur?.(e); }}
      {...rest}
    />
  );
});

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function SelectInput({ style, children, ...rest }, ref) {
  return (
    <select ref={ref} style={{ ...inputBaseStyle, cursor: "pointer", ...style }} {...rest}>
      {children}
    </select>
  );
});

export type TextFieldProps = { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, hint, ...rest }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <TextInput {...rest} />
    </Field>
  );
}
