// @vitest-environment jsdom
// Transport d'envoi (requête simple), transport injecté, réduction d'image, MediaFit et ImageThumb. CLP n'a pas de test pour ces fonctions (`uploadProofImage`, `uploadImage`, `uploadVoiceBlob`,
// `compressImage`, `photoToJpegBase64`, `MediaFit`) : cas écrits d'après son code. AUCUN envoi réseau : `fetch` et XMLHttpRequest sont des doubles.
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { cloudinaryTransport, createCloudinaryUploader } from "../src/web/upload";
import { compressImage, compressedName, photoSize, photoToJpegBase64, scaledSize } from "../src/web/image-compress";
import { MediaFit } from "../src/web/MediaFit";
import { ImageThumb } from "../src/web/ImageThumb";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const CFG = { cloudName: "demo", uploadPreset: "unsigned" };
const reply = (body: unknown) => vi.fn(async () => ({ json: async () => body }) as Response);

describe("createCloudinaryUploader — URL ou null, jamais d'exception", () => {
  it("image : POST multipart sur la ressource « image », preset joint, URL rendue", async () => {
    const fetchDouble = reply({ secure_url: "https://res.cloudinary.com/demo/image/upload/v1/a.png" });
    const up = createCloudinaryUploader({ ...CFG, fetch: fetchDouble as never });
    expect(await up.image(new File(["x"], "capture.png", { type: "image/png" }))).toBe("https://res.cloudinary.com/demo/image/upload/v1/a.png");
    const [url, init] = fetchDouble.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    expect(init.method).toBe("POST");
    const fd = init.body as FormData;
    expect(fd.get("upload_preset")).toBe("unsigned");
    expect((fd.get("file") as File).name).toBe("capture.png");
  });
  it("voix : ressource « video », fichier nommé voice.webm", async () => {
    const fetchDouble = reply({ secure_url: "https://res.cloudinary.com/demo/video/upload/v1/v.webm" });
    const up = createCloudinaryUploader({ ...CFG, fetch: fetchDouble as never });
    expect(await up.voice(new Blob(["x"], { type: "audio/webm" }))).toBe("https://res.cloudinary.com/demo/video/upload/v1/v.webm");
    const [url, init] = fetchDouble.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/video/upload");
    expect(((init.body as FormData).get("file") as File).name).toBe("voice.webm");
  });
  it("échecs : réponse sans URL ou d'un autre type, réseau coupé, JSON illisible → null", async () => {
    expect(await createCloudinaryUploader({ ...CFG, fetch: reply({ error: { message: "x" } }) as never }).image(new Blob(["x"]))).toBeNull();
    expect(await createCloudinaryUploader({ ...CFG, fetch: reply({ secure_url: 42 }) as never }).image(new Blob(["x"]))).toBeNull();
    expect(await createCloudinaryUploader({ ...CFG, fetch: vi.fn(async () => { throw new Error("réseau"); }) as never }).voice(new Blob(["x"]))).toBeNull();
    expect(await createCloudinaryUploader({ ...CFG, fetch: vi.fn(async () => ({ json: async () => { throw new Error("pas du json"); } })) as never }).image(new Blob(["x"]))).toBeNull();
  });
  it("sans cloud ou sans preset : null, aucune requête", async () => {
    const fetchDouble = reply({ secure_url: "https://x.test/a.png" });
    expect(await createCloudinaryUploader({ cloudName: "", uploadPreset: "p", fetch: fetchDouble as never }).image(new Blob(["x"]))).toBeNull();
    expect(await createCloudinaryUploader({ cloudName: "c", fetch: fetchDouble as never }).voice(new Blob(["x"]))).toBeNull();
    expect(fetchDouble).not.toHaveBeenCalled();
  });
  it("le cloud est encodé dans l'adresse", async () => {
    const fetchDouble = reply({ secure_url: "https://x.test/a.png" });
    await createCloudinaryUploader({ cloudName: "a/b c", uploadPreset: "p", fetch: fetchDouble as never }).image(new Blob(["x"]));
    expect((fetchDouble.mock.calls[0] as unknown as [string])[0]).toBe("https://api.cloudinary.com/v1_1/a%2Fb%20c/image/upload");
  });
});

describe("cloudinaryTransport — au contrat d'un UploadTransport", () => {
  it("rejette not_configured sans configuration, sans toucher le réseau", async () => {
    const xhr = vi.fn(); vi.stubGlobal("XMLHttpRequest", xhr);
    await expect(cloudinaryTransport({})(new Blob(["x"]))).rejects.toMatchObject({ code: "not_configured" });
    expect(xhr).not.toHaveBeenCalled();
  });
});

describe("réduction d'image", () => {
  it("scaledSize : jamais agrandie, grand côté ramené à la limite, arrondi au pixel", () => {
    expect(scaledSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(scaledSize(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(scaledSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(scaledSize(1001, 333, 500)).toEqual({ width: 500, height: 166 });
  });
  it("compressedName : l'extension devient .jpg ou .png, un nom sans extension reste tel quel", () => {
    expect(compressedName("IMG_0001.HEIC", true)).toBe("IMG_0001.jpg");
    expect(compressedName("capture.final.webp", false)).toBe("capture.final.png");
    expect(compressedName("sans-extension", true)).toBe("sans-extension");
  });
  it("SVG et GIF passent tels quels", async () => {
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    const gif = new File(["GIF"], "a.gif", { type: "image/gif" });
    expect(await compressImage(svg, 100, 0.8, true)).toBe(svg);
    expect(await compressImage(gif, 100, 0.8, false)).toBe(gif);
  });
  it("JPEG : canevas réduit, fond noir, type et nom convertis", async () => {
    const draw = vi.fn(); const fill = vi.fn(); const ctx = { fillStyle: "", fillRect: fill, drawImage: draw };
    const canvas = { width: 0, height: 0, getContext: () => ctx, toBlob: (cb: (b: Blob | null) => void, mime: string) => cb(new Blob(["jpg"], { type: mime })) };
    const created = vi.spyOn(document, "createElement").mockImplementation(((tag: string) => (tag === "canvas" ? canvas : Document.prototype.createElement.call(document, tag))) as never);
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => undefined }));
    vi.stubGlobal("Image", class { width = 4000; height = 2000; onload: (() => void) | null = null; onerror: (() => void) | null = null; set src(_: string) { queueMicrotask(() => this.onload?.()); } });
    const out = await compressImage(new File(["x"], "photo.PNG", { type: "image/png" }), 1000, 0.8, true);
    created.mockRestore();
    expect([canvas.width, canvas.height]).toEqual([1000, 500]);
    expect(ctx.fillStyle).toBe("black");
    expect(fill).toHaveBeenCalledWith(0, 0, 1000, 500);
    expect(draw).toHaveBeenCalled();
    expect(out.name).toBe("photo.jpg");
    expect(out.type).toBe("image/jpeg");
  });
  it("image illisible : rejette, l'adresse temporaire est libérée", async () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: revoke }));
    vi.stubGlobal("Image", class { onload: (() => void) | null = null; onerror: (() => void) | null = null; set src(_: string) { queueMicrotask(() => this.onerror?.()); } });
    await expect(compressImage(new File(["x"], "a.png", { type: "image/png" }), 100, 0.8, false)).rejects.toThrow("Image load failed");
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });
  it("photoToJpegBase64 : grand côté 1600, JPEG 0,82, base64 sans l'en-tête ; photoSize : null si illisible", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 3200, height: 2400, close })));
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,QUJD");
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toDataURL };
    const created = vi.spyOn(document, "createElement").mockImplementation(((tag: string) => (tag === "canvas" ? canvas : Document.prototype.createElement.call(document, tag))) as never);
    const out = await photoToJpegBase64(new Blob(["x"]));
    created.mockRestore();
    expect(out).toEqual({ dataBase64: "QUJD", mimeType: "image/jpeg" });
    expect([canvas.width, canvas.height]).toEqual([1600, 1200]);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.82);
    expect(close).toHaveBeenCalled();
    expect(await photoSize(new Blob(["x"]))).toEqual({ width: 3200, height: 2400 });
    vi.stubGlobal("createImageBitmap", vi.fn(async () => { throw new Error("illisible"); }));
    expect(await photoSize(new Blob(["x"]))).toBeNull();
  });
});

describe("MediaFit et ImageThumb", () => {
  const CLD = "https://res.cloudinary.com/demo/image/upload/v1/x.jpg";
  it("MediaFit : image telle quelle, filigrane injecté seulement s'il est demandé", () => {
    expect(renderToStaticMarkup(createElement(MediaFit, { url: CLD, alt: "plat", w: 300, h: 200 }))).toContain(`src="${CLD}"`);
    const marked = renderToStaticMarkup(createElement(MediaFit, { url: CLD, alt: "plat", w: 300, h: 200, watermark: { text: "Ma Cuisine", color: "FFFFFF" } }));
    expect(marked).toContain("w_300,h_200,c_fill,g_auto");
    expect(marked).toContain("l_text:Arial_20_bold:Ma%2520Cuisine,co_rgb:FFFFFF");
  });
  it("MediaFit sans image : cadre plein avec l'emoji de contenu, sans <img>", () => {
    const html = renderToStaticMarkup(createElement(MediaFit, { url: null, alt: "", w: 100, h: 100, emoji: "\u{1F372}", watermark: { text: "x", color: "000000" } }));
    expect(html).not.toContain("<img");
    expect(html).toContain("\u{1F372}");
    expect(html).toContain("font-size:35px");
  });
  it("ImageThumb : un bouton nommé « Agrandir la photo », sans title en écho", () => {
    const html = renderToStaticMarkup(createElement(ImageThumb, { src: CLD, alt: "Photo", onOpen: () => undefined }));
    expect(html).toContain('aria-label="Agrandir la photo"');
    expect(html).not.toContain("title=");
    expect(html).toContain('loading="lazy"');
  });
});
