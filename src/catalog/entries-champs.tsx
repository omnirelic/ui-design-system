import { Checkbox } from "../web/Checkbox";
import { Field, SelectInput, TextField, TextInput } from "../web/Field";
import { PhoneField } from "../web/PhoneField";
import { PhoneInput } from "../web/PhoneInput";
import { SearchableSelect } from "../web/SearchableSelect";
import { DEFAULT_COUNTRY, displayPhone, flagOf, formatNational, isValidPhone, parseStoredPhone, phoneCountries, searchCountries, toE164 } from "../web/phone";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, filterCountries, resolvePhone } from "../web/phone-intl";
import { Controlled, choices, noop } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

const FILLED = choices(["empty", "Vide"], ["filled", "Rempli"], ["disabled", "Désactivé"]);
const OPTIONS = [
  { value: "douala", label: "Douala", sub: "Littoral" },
  { value: "yaounde", label: "Yaoundé", sub: "Centre" },
];

export const CHAMPS_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "Field",
    group: "champs",
    kind: "component",
    render: () => (
      <Field label="Quartier">
        <TextInput placeholder="Akwa" readOnly />
      </Field>
    ),
  },
  {
    name: "TextInput",
    group: "champs",
    kind: "component",
    states: FILLED,
    render: (_v, state, f) => <TextInput defaultValue={state === "empty" ? "" : f.person.name} placeholder="Nom" disabled={state === "disabled"} />,
  },
  {
    name: "SelectInput",
    group: "champs",
    kind: "component",
    states: choices(["idle", "Repos"], ["disabled", "Désactivé"]),
    render: (_v, state) => (
      <SelectInput defaultValue="douala" disabled={state === "disabled"}>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectInput>
    ),
  },
  {
    name: "TextField",
    group: "champs",
    kind: "component",
    states: FILLED,
    render: (_v, state, f) => <TextField label="Email" defaultValue={state === "empty" ? "" : f.person.email} disabled={state === "disabled"} />,
  },
  {
    name: "Checkbox",
    group: "champs",
    kind: "component",
    states: choices(["unchecked", "Décochée"], ["checked", "Cochée"], ["disabled", "Désactivée"]),
    render: (_v, state) => <Checkbox label="Livraison à domicile" defaultChecked={state === "checked"} disabled={state === "disabled"} onChange={noop} />,
  },
  {
    name: "SearchableSelect",
    group: "champs",
    kind: "component",
    states: choices(["empty", "Vide"], ["selected", "Choisi"]),
    render: (_v, state) => (
      <Controlled<string | null> initial={state === "selected" ? "douala" : null}>
        {(value, set) => <SearchableSelect value={value} onChange={set} options={OPTIONS} />}
      </Controlled>
    ),
  },
  {
    name: "PhoneInput",
    group: "champs",
    kind: "component",
    states: choices(["empty", "Vide"], ["filled", "Rempli"], ["invalid", "Invalide"], ["disabled", "Désactivé"]),
    render: (_v, state, f) => (
      <Controlled<string> initial={state === "empty" ? "" : state === "invalid" ? "+23769" : `+237${f.person.phone}`}>
        {(value, set) => <PhoneInput value={value} onChange={set} label="Téléphone" disabled={state === "disabled"} error={state === "invalid" ? "Numéro invalide" : undefined} />}
      </Controlled>
    ),
  },
  {
    name: "PhoneField",
    group: "champs",
    kind: "component",
    states: choices(["empty", "Vide"], ["filled", "Rempli"], ["invalid", "Invalide"]),
    render: (_v, state, f) => (
      <Controlled<{ country: (typeof PHONE_COUNTRIES)[number]; raw: string }> initial={{ country: PHONE_COUNTRIES.find((c) => c.iso === DEFAULT_PHONE_COUNTRY)!, raw: state === "empty" ? "" : state === "invalid" ? "6 99 12" : f.person.phone }}>
        {(v, set) => <PhoneField country={v.country} value={v.raw} onCountry={(country) => set({ ...v, country })} onChange={(raw) => set({ ...v, raw })} invalid={state === "invalid"} />}
      </Controlled>
    ),
  },
  { name: "DEFAULT_PHONE_COUNTRY", group: "champs", kind: "constant", examples: () => [{ call: "DEFAULT_PHONE_COUNTRY", result: DEFAULT_PHONE_COUNTRY }] },
  { name: "PHONE_COUNTRIES", group: "champs", kind: "constant", examples: () => [{ call: "PHONE_COUNTRIES.length", result: String(PHONE_COUNTRIES.length) }, { call: "PHONE_COUNTRIES[0]", result: JSON.stringify(PHONE_COUNTRIES[0]) }] },
  {
    name: "filterCountries",
    group: "champs",
    kind: "function",
    examples: () => ["cote", "+33", "237"].map((q) => ({ call: `filterCountries(PHONE_COUNTRIES, '${q}')`, result: filterCountries(PHONE_COUNTRIES, q).map((c) => c.name).join(", ") })),
  },
  {
    name: "resolvePhone",
    group: "champs",
    kind: "function",
    examples: (f) => [f.person.phone, "+33 6 12 34 56 78", "90397489"].map((n) => ({ call: `resolvePhone(CM, '${n}')`, result: JSON.stringify(resolvePhone(PHONE_COUNTRIES.find((c) => c.iso === "CM")!, n).e164) })),
  },
  { name: "DEFAULT_COUNTRY", group: "champs", kind: "constant", examples: () => [{ call: "DEFAULT_COUNTRY", result: DEFAULT_COUNTRY }] },
  { name: "flagOf", group: "champs", kind: "function", examples: () => ["CM", "FR", "SN"].map((c) => ({ call: `flagOf('${c}')`, result: flagOf(c) })) },
  {
    name: "phoneCountries",
    group: "champs",
    kind: "function",
    examples: () => [{ call: "phoneCountries().length", result: String(phoneCountries().length) }, { call: "phoneCountries()[0]", result: JSON.stringify(phoneCountries()[0]) }],
  },
  {
    name: "searchCountries",
    group: "champs",
    kind: "function",
    examples: () => ["cam", "+33", "sen"].map((q) => ({ call: `searchCountries(list, '${q}')`, result: searchCountries(phoneCountries(), q).slice(0, 3).map((c) => c.name).join(", ") })),
  },
  {
    name: "parseStoredPhone",
    group: "champs",
    kind: "function",
    examples: (f) => [`+237${f.person.phone}`, f.person.phone, ""].map((p) => ({ call: `parseStoredPhone('${p}')`, result: JSON.stringify(parseStoredPhone(p)) })),
  },
  {
    name: "toE164",
    group: "champs",
    kind: "function",
    examples: (f) => [{ call: `toE164('CM', '${f.person.phone}')`, result: toE164("CM", f.person.phone) }, { call: "toE164('FR', '06 12 34 56 78')", result: toE164("FR", "06 12 34 56 78") }],
  },
  {
    name: "isValidPhone",
    group: "champs",
    kind: "function",
    examples: (f) => [f.person.phone, "69039"].map((n) => ({ call: `isValidPhone('CM', '${n}')`, result: String(isValidPhone("CM", n)) })),
  },
  {
    name: "formatNational",
    group: "champs",
    kind: "function",
    examples: (f) => [{ call: `formatNational('CM', '${f.person.phone}')`, result: formatNational("CM", f.person.phone) }],
  },
  {
    name: "displayPhone",
    group: "champs",
    kind: "function",
    examples: (f) => [`+237${f.person.phone}`, f.person.phone, null].map((p) => ({ call: `displayPhone(${JSON.stringify(p)})`, result: displayPhone(p) })),
  },
];
