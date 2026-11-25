// Tokens : introspectés depuis les objets réels, jamais recopiés.
import { alpha, colors, fontSize, radius, semantic, shades, spacing, typography } from "../tokens";
import { ACCENT, ACCENT_LIGHT, BG, BG2, BORDER, CARD, DIM, DIM2, FONT, MONO, TXT, rem } from "../web/theme";
import { useIsDesktop } from "../web/hooks";
import { Text, type TextVariant } from "../web/Text";
import { SwatchList } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

const strings = (o: Record<string, string | number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
const colorToken = (name: string, values: Record<string, string>): CatalogEntrySourceInterface => ({
  name,
  group: "tokens",
  kind: "constant",
  render: () => <SwatchList values={values} />,
});
const cssToken = (name: string, value: string): CatalogEntrySourceInterface => ({
  name,
  group: "tokens",
  kind: "constant",
  render: () => <SwatchList values={{ [name]: value }} />,
});
const scale = (name: string, values: Record<string, string | number>, unit = "px"): CatalogEntrySourceInterface => ({
  name,
  group: "tokens",
  kind: "constant",
  examples: () => Object.entries(values).map(([k, v]) => ({ call: `${name}.${k}`, result: `${v}${unit}` })),
});

const TEXT_VARIANTS: TextVariant[] = ["caption", "label", "body", "base", "lg", "xl", "xxl", "display1", "display2", "display3", "mono"];

function DesktopProbe() {
  return <span>{useIsDesktop() ? "Bureau" : "Mobile"}</span>;
}

export const TOKENS_ENTRIES: CatalogEntrySourceInterface[] = [
  colorToken("colors", strings(colors)),
  colorToken("alpha", strings(alpha)),
  colorToken("semantic", strings(semantic)),
  colorToken("shades", strings(shades)),
  {
    name: "typography",
    group: "tokens",
    kind: "constant",
    render: () => (
      <div style={{ display: "grid", gap: 6 }}>
        {Object.entries(typography).map(([k, v]) => (
          <div key={k} style={{ fontFamily: `${v}, sans-serif`, fontSize: 18 }}>
            {k} · {v}
          </div>
        ))}
      </div>
    ),
  },
  scale("fontSize", fontSize),
  scale("radius", radius),
  { name: "spacing", group: "tokens", kind: "function", examples: () => [1, 2, 4, 8].map((n) => ({ call: `spacing(${n})`, result: `${spacing(n)}px` })) },
  { name: "rem", group: "tokens", kind: "function", examples: () => [12, 14, 16, 24].map((n) => ({ call: `rem(${n})`, result: rem(n) })) },
  scale("FONT", FONT, ""),
  cssToken("BG", BG),
  cssToken("BG2", BG2),
  cssToken("CARD", CARD),
  cssToken("TXT", TXT),
  cssToken("DIM", DIM),
  cssToken("DIM2", DIM2),
  cssToken("BORDER", BORDER),
  cssToken("ACCENT", ACCENT),
  cssToken("ACCENT_LIGHT", ACCENT_LIGHT),
  { name: "MONO", group: "tokens", kind: "constant", render: () => <span style={{ fontFamily: MONO, fontSize: 18 }}>0123456789 · #0736</span> },
  {
    name: "Text",
    group: "tokens",
    kind: "component",
    variants: TEXT_VARIANTS.map((id) => ({ id, label: id })),
    render: (variant) => <Text variant={variant as TextVariant}>Commande reçue</Text>,
  },
  { name: "useIsDesktop", group: "surfaces", kind: "hook", render: () => <DesktopProbe /> },
];

