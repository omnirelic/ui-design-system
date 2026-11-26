// Tests miroir de web/src/tracking/__tests__/proof-file.test.ts de Chez la Petite ; seuls les imports changent.
import { describe, expect, it } from "vitest";
import { checkProofFile, MAX_PROOF_BYTES } from "../src/web/proof-file";

const file = (type: string, size: number) => ({ type, size }) as File;

describe("checkProofFile", () => {
  it("accepte une image de taille raisonnable", () => {
    expect(checkProofFile(file("image/jpeg", 1_000_000))).toBeNull();
    expect(checkProofFile(file("image/png", MAX_PROOF_BYTES))).toBeNull();
  });
  it("refuse ce qui n'est pas une image", () => {
    expect(checkProofFile(file("application/pdf", 1000))).toBe("Choisissez une image.");
    expect(checkProofFile(file("", 1000))).toBe("Choisissez une image.");
  });
  it("refuse une image trop lourde ou vide", () => {
    expect(checkProofFile(file("image/jpeg", MAX_PROOF_BYTES + 1))).toBe("Image trop lourde (10 Mo max).");
    expect(checkProofFile(file("image/jpeg", 0))).toBe("Choisissez une image.");
  });
});
