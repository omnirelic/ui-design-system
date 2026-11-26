import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

describe("peerDependencies : un `npm install` simple passe dans une app web", () => {
  it("aucun paquet natif n'est déclaré en pair (GitHub Packages retire peerDependenciesMeta)", () => {
    for (const n of ["react-native", "react-native-svg", "expo-camera", "expo-linear-gradient", "phosphor-react-native"]) {
      expect(pkg.peerDependencies, n).not.toHaveProperty(n);
      expect(pkg.devDependencies, `${n} reste en devDependencies pour le build`).toHaveProperty(n);
    }
  });
  it("le web exige react et react-qr-code (QrCard à la racine) ; libphonenumber-js (/phone) et react-router-dom (/query-params) sont optionnels", () => {
    expect(Object.keys(pkg.peerDependencies).sort()).toEqual(["libphonenumber-js", "react", "react-qr-code", "react-router-dom"]);
    expect(pkg.peerDependenciesMeta).toEqual({ "libphonenumber-js": { optional: true }, "react-router-dom": { optional: true } });
  });
});
