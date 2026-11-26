// @vitest-environment jsdom
// Tests miroir de web/src/admin/ui/__tests__/useCopied.test.tsx de Chez la Petite.
import { describe, it, expect, vi, afterEach } from "vitest";
import { writeClipboard } from "../src/web/useCopied";

afterEach(() => { vi.restoreAllMocks(); });

describe("writeClipboard", () => {
  it("utilise l'API clipboard quand elle est disponible", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    expect(await writeClipboard("abc")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("abc");
  });

  it("replie sur execCommand quand l'API est refusée", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: typeof exec }).execCommand = exec;
    expect(await writeClipboard("42")).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("renvoie false quand rien ne marche", async () => {
    Object.assign(navigator, { clipboard: undefined });
    (document as unknown as { execCommand: () => boolean }).execCommand = () => false;
    expect(await writeClipboard("x")).toBe(false);
  });

  it("accepte un texte différé : attend la promesse puis copie le texte résolu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    expect(await writeClipboard(Promise.resolve("différé"))).toBe(true);
    expect(writeText).toHaveBeenCalledWith("différé");
  });

  it("renvoie false quand le texte différé échoue", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
    expect(await writeClipboard(Promise.reject(new Error("x")))).toBe(false);
  });
});
