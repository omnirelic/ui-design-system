// Parité avec le VRAI code de Chez la Petite (chezlapetite origin/dev bb247c29) : les sorties de test/golden/clp-*.json ont été produites en exécutant ses fonctions
// (générateur : test/golden/generate-clp-golden-lot8.ts.txt) ; le paquet est rejoué contre elles, cas par cas. Ni photo ni voix réelles : des noms de fichier et des URL fabriqués.
import { describe, expect, it } from "vitest";
import { cdnUrl, cdnUrlWatermarked, mediaDownloadUrl, mediaViewUrl, sortGallery } from "../src/web/image-urls";
import { matchesAccept } from "../src/web/file-drop";
import { MAX_PROOF_BYTES, checkProofFile } from "../src/web/proof-file";
import { BARS, SPEEDS, nextSpeed, seekRatio, speedLabel, waveBars } from "../src/web/voice-wave";
import { formatDuration, pickMime } from "../src/web/voice";
import { THROWS, fromGolden, golden, json, unwrap } from "./golden/lot7";

// Le filigrane de CLP (texte et couleur écrits en dur chez elle) est passé en entrée : le paquet ne porte aucune marque.
const CLP_MARK = { text: "CHEZ LA PETITE", color: "E8C88A" };
const run = (f: () => unknown): unknown => { try { return json(f()); } catch { return THROWS; } };
const expected = (r: { ok?: unknown; throw?: string }) => (unwrap(r) === THROWS ? THROWS : json(unwrap(r)));

describe("adresses d'images — parité avec CLP", () => {
  const g = golden("clp-image-urls.json");
  it("mediaViewUrl : 19 adresses", () => {
    for (const c of g.view) expect(run(() => mediaViewUrl(fromGolden(c.input) as string)), JSON.stringify(c.input)).toEqual(expected(c.out));
  });
  it("mediaDownloadUrl : 19 adresses", () => {
    for (const c of g.download) expect(run(() => mediaDownloadUrl(fromGolden(c.input) as string)), JSON.stringify(c.input)).toEqual(expected(c.out));
  });
  it("sortGallery : ordre chronologique, stable, sans date à la fin", () => {
    for (const c of g.sort) expect(run(() => sortGallery(c.input).map((i: { id: string }) => i.id)), JSON.stringify(c.input)).toEqual(expected(c.out));
  });
  it("cdnUrl et cdnUrlWatermarked : 19 adresses × 7 tailles", () => {
    const cases = golden("clp-cdn.json");
    expect(cases).toHaveLength(19 * 7);
    for (const c of cases) {
      const [u, w, h] = c.input as [unknown, number, number];
      expect(run(() => cdnUrl(fromGolden(u) as string, w, h)), JSON.stringify(c.input)).toEqual(expected(c.plain));
      expect(run(() => cdnUrlWatermarked(fromGolden(u) as string, w, h, CLP_MARK)), JSON.stringify(c.input)).toEqual(expected(c.watermark));
    }
  });
});

describe("dépôt de fichier et preuve — parité avec CLP", () => {
  it("matchesAccept : 13 fichiers × 15 règles", () => {
    const cases = golden("clp-file-accept.json");
    expect(cases).toHaveLength(13 * 15);
    for (const c of cases) {
      const [name, type, accept] = c.input as [string, string, string];
      expect(matchesAccept({ name, type }, accept), JSON.stringify(c.input)).toBe(unwrap(c.out));
    }
  });
  it("checkProofFile : 10 types × 9 tailles, plafond de 10 Mo", () => {
    const g = golden("clp-proof-file.json");
    expect(MAX_PROOF_BYTES).toBe(g.max);
    expect(g.cases).toHaveLength(90);
    for (const c of g.cases) {
      const [type, size] = c.input as [string, number];
      expect(checkProofFile({ type, size }), JSON.stringify(c.input)).toBe(unwrap(c.out));
    }
  });
});

describe("notes vocales — parité avec CLP", () => {
  const g = golden("clp-voice.json");
  const num = (x: unknown) => (x === "NaN" ? NaN : x === "Infinity" ? Infinity : x === "-Infinity" ? -Infinity : (x as number));
  it("formatDuration : 22 durées, dont négatives, NaN et infinies", () => {
    for (const c of g.duration) expect(formatDuration(num(c.input)), String(c.input)).toBe(unwrap(c.out));
  });
  it("pickMime : l'ordre webm/opus, mp4, webm, ogg/opus", () => {
    for (const c of g.mime) expect(pickMime((t) => (c.input as string[]).includes(t)) ?? null, JSON.stringify(c.input)).toBe(unwrap(c.out));
  });
  it("waveBars : 7 graines, 40 barres par défaut, stables", () => {
    expect(BARS).toBe(g.bars.count);
    expect([...SPEEDS]).toEqual(g.bars.speeds);
    for (const c of g.bars.seeds) {
      expect(waveBars(c.input), c.input.slice(0, 20)).toEqual(unwrap(c.out));
      expect(waveBars(c.input, 7)).toEqual(unwrap(c.short));
      expect(waveBars(c.input)).toEqual(waveBars(c.input));
    }
  });
  it("seekRatio : bornée à 0-1, 0 si la largeur est nulle ou négative", () => {
    for (const c of g.seek) expect(seekRatio(...(c.input as [number, number, number])), JSON.stringify(c.input)).toBe(unwrap(c.out));
  });
  it("nextSpeed et speedLabel : 1 → 1,5 → 2 → 1, libellés « 1,5× »", () => {
    for (const c of g.speed) {
      expect(nextSpeed(c.input), String(c.input)).toBe(unwrap(c.next));
      expect(speedLabel(c.input), String(c.input)).toBe(unwrap(c.label));
    }
  });
});
