// Méta-spec du lot « images, preuves et notes vocales » :
// (1) les composants n'ont ni couleur en dur (hexadécimal, rgb(), hsl()) ni emoji : toute couleur est un jeton du thème (le noir et le blanc du visualiseur passent par `color-mix`) ;
// (2) le transport est INJECTÉ : seul upload.ts parle au réseau et nomme un service d'images ; aucune variable d'environnement, aucun stockage du navigateur, aucune clé, aucune marque de CLP ;
// (3) aucune infobulle `title` en écho d'un libellé (règle d'interface) : un `title` n'est posé que sur un bouton icône seule, avec le même texte que son `aria-label`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { codeLines } from "../src/web/entity-graph";

const read = (f: string) => readFileSync(join(__dirname, "../src/web", f), "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FUNC = /\b(rgb|rgba|hsl|hsla)\(/;
const EMOJI = /\p{Extended_Pictographic}/u;

const COMPONENTS = ["ImageViewer.tsx", "ImageThumb.tsx", "ImageGallery.tsx", "PhotoLink.tsx", "PhotoThumb.tsx", "ProofField.tsx", "Thumbnail.tsx", "MediaFit.tsx", "FileInput.tsx", "image-viewer-css.ts", "file-drop-css.ts",
  "VoiceTextInput.tsx", "VoiceRecordingBar.tsx", "VoicePlayer.tsx", "VoiceMessage.tsx", "voice-css.ts", "field-focus.ts"];
const LOGIC = ["file-drop.ts", "image-urls.ts", "proof-file.ts", "image-compress.ts", "voice.ts", "voice-wave.ts", "use-proof-upload.ts", "gallery-context.ts", "safe-date.ts", "upload.ts"];

describe("images et voix — jetons de thème seulement", () => {
  for (const f of [...COMPONENTS, ...LOGIC]) {
    it(`${f} : aucune couleur en dur, aucun emoji`, () => {
      const bad = codeLines(read(f)).flatMap((l, i) => (HEX.test(l) || FUNC.test(l) || EMOJI.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
});

describe("images et voix — transport injecté, aucune clé", () => {
  const NET = /\bfetch\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket/;
  const SECRET = /import\.meta\.env|process\.env|VITE_|localStorage|sessionStorage|indexedDB|CLOUDINARY_|api_key|api_secret/;
  const BRAND = /chez\s*la\s*petite|chezlapetite|\bclp\b/i;
  for (const f of [...COMPONENTS, ...LOGIC]) {
    it(`${f} : ni variable d'environnement, ni stockage, ni clé, ni marque`, () => {
      const bad = codeLines(read(f)).flatMap((l, i) => (SECRET.test(l) || BRAND.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
  it("seul upload.ts émet une requête ; il n'a ni valeur de cloud ni preset, tout vient de l'appelant", () => {
    const talkers = [...COMPONENTS, ...LOGIC].filter((f) => codeLines(read(f)).some((l) => NET.test(l)));
    expect(talkers).toEqual(["upload.ts"]);
    expect(codeLines(read("upload.ts")).some((l) => /cloudName\s*[:=]\s*["'`]/.test(l) || /uploadPreset\s*[:=]\s*["'`]/.test(l))).toBe(false);
  });
  it("seul upload.ts nomme un service d'images pour l'envoi", () => {
    const named = [...COMPONENTS, ...LOGIC].filter((f) => codeLines(read(f)).some((l) => /api\.cloudinary\.com/.test(l)));
    expect(named).toEqual(["upload.ts"]);
  });
  it("les composants vocaux et la preuve n'appellent que ce qu'on leur injecte (onUpload, onPick)", () => {
    expect(codeLines(read("VoiceTextInput.tsx")).some((l) => /\bonUpload\(/.test(l))).toBe(true);
    expect(codeLines(read("use-proof-upload.ts")).some((l) => /\bupload\(/.test(l))).toBe(true);
  });
});

describe("images et voix — aucune infobulle en écho", () => {
  it("aucun title sur la vignette, la miniature ni le lien-photo (leur nom accessible suffit)", () => {
    for (const f of ["ImageThumb.tsx", "PhotoThumb.tsx", "PhotoLink.tsx"]) expect(codeLines(read(f)).some((l) => /\btitle=/.test(l)), f).toBe(false);
  });
  it("un title n'est posé que sur un bouton icône seule, avec le même texte que son aria-label", () => {
    const viewer = codeLines(read("ImageViewer.tsx")).join("\n");
    expect(viewer).toMatch(/title=\{label\} aria-label=\{label\}/);
    const proof = codeLines(read("ProofField.tsx")).filter((l) => /\btitle=/.test(l));
    expect(proof).toHaveLength(1);
    expect(proof[0]).toContain(`title="Retirer l'image" aria-label="Retirer l'image"`);
    for (const f of ["VoiceTextInput.tsx", "VoiceRecordingBar.tsx", "VoicePlayer.tsx", "VoiceMessage.tsx", "FileInput.tsx"]) expect(codeLines(read(f)).some((l) => /\btitle=/.test(l)), f).toBe(false);
  });
  it("chaque bouton des notes vocales a un nom accessible", () => {
    for (const f of ["VoiceTextInput.tsx", "VoiceRecordingBar.tsx", "VoicePlayer.tsx", "VoiceMessage.tsx"]) {
      const buttons = codeLines(read(f)).join("\n").match(/<button\b(?:=>|[^>])*>/g) ?? [];
      expect(buttons.length, f).toBeGreaterThan(0);
      for (const b of buttons) expect(b, `${f} : ${b.slice(0, 60)}`).toMatch(/aria-label=/);
    }
  });
});
