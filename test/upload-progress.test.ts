// Tests miroir de web/src/admin/lib/__tests__/cloudinary-upload.test.ts de Chez la Petite ; seuls les imports changent (le cloud et le preset sont injectés).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UploadError, uploadToCloudinaryWithProgress } from "../src/web/upload";

class FakeXhr {
  static last: FakeXhr;
  upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void; onerror?: () => void; onabort?: () => void;
  status = 0; responseText = "";
  method = ""; url = ""; body: FormData | null = null; aborted = false;
  constructor() { FakeXhr.last = this; }
  open(method: string, url: string) { this.method = method; this.url = url; }
  send(body: FormData) { this.body = body; }
  abort() { this.aborted = true; this.onabort?.(); }
  finish(status: number, body: unknown) { this.status = status; this.responseText = typeof body === "string" ? body : JSON.stringify(body); this.onload?.(); }
}
const file = new File(["x"], "capture.png", { type: "image/png" });

const CFG = { cloudName: "clp", uploadPreset: "unsigned" };
beforeEach(() => { vi.stubGlobal("XMLHttpRequest", FakeXhr); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("uploadToCloudinaryWithProgress", () => {
  it("poste le fichier et le preset non signé sur le cloud, rend l'URL https", async () => {
    const p = uploadToCloudinaryWithProgress(file, CFG);
    const x = FakeXhr.last;
    expect(x.method).toBe("POST");
    expect(x.url).toBe("https://api.cloudinary.com/v1_1/clp/image/upload");
    expect(x.body?.get("upload_preset")).toBe("unsigned");
    expect(x.body?.get("file")).toBeInstanceOf(File);
    x.finish(200, { secure_url: "https://res.cloudinary.com/clp/image/upload/v1/a.png" });
    await expect(p).resolves.toBe("https://res.cloudinary.com/clp/image/upload/v1/a.png");
  });

  it("progression de 0 à 1, plafonnée", async () => {
    const seen: number[] = [];
    const p = uploadToCloudinaryWithProgress(file, { ...CFG, onProgress: (f) => seen.push(f) });
    FakeXhr.last.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 200 });
    FakeXhr.last.upload.onprogress?.({ lengthComputable: true, loaded: 300, total: 200 });
    FakeXhr.last.upload.onprogress?.({ lengthComputable: false, loaded: 1, total: 0 });
    expect(seen).toEqual([0.25, 1]);
    FakeXhr.last.finish(200, { secure_url: "https://res.cloudinary.com/x/a.png" });
    await p;
  });

  it("annulation : le signal interrompt la requête et rejette « aborted » ; un signal déjà levé ne part même pas", async () => {
    const ctrl = new AbortController();
    const p = uploadToCloudinaryWithProgress(file, { ...CFG, signal: ctrl.signal });
    const x = FakeXhr.last;
    ctrl.abort();
    expect(x.aborted).toBe(true);
    await expect(p).rejects.toMatchObject({ code: "aborted" });
    const done = new AbortController(); done.abort();
    await expect(uploadToCloudinaryWithProgress(file, { ...CFG, signal: done.signal })).rejects.toMatchObject({ code: "aborted" });
  });

  it("échecs : refus de Cloudinary, réponse sans URL ou en http, réseau coupé, variables absentes", async () => {
    let p = uploadToCloudinaryWithProgress(file, CFG);
    FakeXhr.last.finish(400, { error: { message: "Upload preset not found" } });
    await expect(p).rejects.toMatchObject({ code: "rejected" });
    p = uploadToCloudinaryWithProgress(file, CFG);
    FakeXhr.last.finish(200, { secure_url: "http://insecure/a.png" });
    await expect(p).rejects.toBeInstanceOf(UploadError);
    p = uploadToCloudinaryWithProgress(file, CFG);
    FakeXhr.last.finish(200, "pas du json");
    await expect(p).rejects.toMatchObject({ code: "rejected" });
    p = uploadToCloudinaryWithProgress(file, CFG);
    FakeXhr.last.onerror?.();
    await expect(p).rejects.toMatchObject({ code: "network" });
    await expect(uploadToCloudinaryWithProgress(file, { cloudName: "clp", uploadPreset: "" })).rejects.toMatchObject({ code: "not_configured" });
    await expect(uploadToCloudinaryWithProgress(file, { cloudName: "", uploadPreset: "unsigned" })).rejects.toMatchObject({ code: "not_configured" });
  });
});

describe("uploadToCloudinaryWithProgress — statut (ajout du paquet, CLP ne le teste pas)", () => {
  it("un statut hors 2xx est refusé même si la réponse porte une URL https", async () => {
    for (const status of [199, 300, 400, 500]) {
      const p = uploadToCloudinaryWithProgress(file, CFG);
      FakeXhr.last.finish(status, { secure_url: "https://res.cloudinary.com/clp/image/upload/v1/a.png" });
      await expect(p).rejects.toMatchObject({ code: "rejected" });
    }
  });
});

