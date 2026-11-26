// @vitest-environment jsdom
// Notes vocales : VoiceTextInput (enregistrement par MediaRecorder, pause, reprise, annulation, envoi, erreurs), VoiceRecordingBar, VoicePlayer, VoiceMessage, startRecording.
// Mêmes doubles de MediaRecorder / getUserMedia que les tests vocaux de ChatComposer de Chez la Petite (web/src/chat/__tests__/ChatComposer.test.tsx). Aucune voix réelle, aucun réseau :
// les blobs contiennent du texte et le transport est un double.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VoiceTextInput } from "../src/web/VoiceTextInput";
import { VoiceRecordingBar } from "../src/web/VoiceRecordingBar";
import { VoicePlayer } from "../src/web/VoicePlayer";
import { VoiceMessage } from "../src/web/VoiceMessage";
import { MIN_VOICE_SECONDS, blobToBase64, isUsableRecording, startRecording, voiceSupported } from "../src/web/voice";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root; let host: HTMLElement;
const stopped = vi.fn();
const recorders: FakeRecorder[] = [];
class FakeRecorder {
  static isTypeSupported = (t: string) => t === "audio/mp4";
  static reported = "audio/mp4";
  mimeType = FakeRecorder.reported; state = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
  paused = 0; resumed = 0; opts: unknown;
  constructor(public stream: unknown, opts?: unknown) { this.opts = opts; recorders.push(this); }
  start() { this.state = "recording"; }
  pause() { this.paused++; }
  resume() { this.resumed++; }
  stop() { this.ondataavailable?.({ data: new Blob(["voice"]) }); this.onstop?.(); }
}
beforeEach(() => {
  stopped.mockReset(); recorders.length = 0;
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: stopped }] })) } });
  (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeRecorder;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.restoreAllMocks(); });

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const btn = (label: string) => host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
const click = async (b: HTMLElement | null) => { await act(async () => { b!.click(); }); await flush(); };

function Field({ upload, initialUrl = null }: { upload: (b: Blob) => Promise<string | null>; initialUrl?: string | null }) {
  const [text, setText] = useState(""); const [voice, setVoice] = useState<string | null>(initialUrl);
  return createElement(VoiceTextInput, { text, onTextChange: setText, voiceUrl: voice, onVoiceChange: setVoice, onUpload: upload });
}
const mountField = (upload: (b: Blob) => Promise<string | null>, initialUrl?: string | null) => act(async () => { root.render(createElement(Field, { upload, initialUrl })); });

describe("VoiceTextInput — enregistrer, envoyer", () => {
  it("repos : zone de texte + micro nommé ; le micro démarre l'enregistrement et montre la barre (corbeille, pause, envoi)", async () => {
    await mountField(async () => null);
    expect(host.querySelector("textarea")?.placeholder).toBe("Ajouter une note…");
    await click(btn("Enregistrer une note vocale"));
    expect(host.querySelector("textarea")).toBeNull();
    expect(btn("Annuler")).not.toBeNull(); expect(btn("Pause")).not.toBeNull(); expect(btn("Envoyer la note")).not.toBeNull();
    expect(host.textContent).toContain("0:00");
  });
  it("envoi : le blob étiqueté audio/webm part vers le transport injecté, l'URL rendue s'affiche avec le lecteur et la suppression", async () => {
    const upload = vi.fn(async () => "https://res.cloudinary.com/demo/video/upload/v1/v.webm");
    await mountField(upload);
    await click(btn("Enregistrer une note vocale"));
    await click(btn("Envoyer la note"));
    expect(upload).toHaveBeenCalledTimes(1);
    const blob = (upload.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe("audio/webm"); // CLP : étiqueté webm quelle que soit la sortie du navigateur (comportement conservé)
    expect(stopped).toHaveBeenCalled(); // micro libéré
    expect(host.querySelector("audio")?.getAttribute("src")).toContain("v.webm");
    expect(btn("Supprimer la note vocale")).not.toBeNull();
    expect(host.querySelector("textarea")).not.toBeNull();
  });
  it("suppression : la note disparaît, le lecteur aussi", async () => {
    await mountField(async () => null, "https://x.test/v.webm");
    expect(host.querySelector("audio")).not.toBeNull();
    await click(btn("Supprimer la note vocale"));
    expect(host.querySelector("audio")).toBeNull();
  });
  it("envoi en cours : micro désactivé et message « Envoi de la note vocale… » tant que le transport n'a pas rendu", async () => {
    let done!: (u: string | null) => void;
    await mountField(() => new Promise<string | null>((r) => { done = r; }));
    await click(btn("Enregistrer une note vocale"));
    await click(btn("Envoyer la note"));
    expect(host.textContent).toContain("Envoi de la note vocale…");
    expect(btn("Enregistrer une note vocale")!.disabled).toBe(true);
    await act(async () => { done("https://x.test/v.webm"); }); await flush();
    expect(host.textContent).not.toContain("Envoi de la note vocale…");
  });
  it("échec d'envoi (null ou exception) : « Échec de l'envoi. Réessayez. », aucune note", async () => {
    await mountField(async () => null);
    await click(btn("Enregistrer une note vocale")); await click(btn("Envoyer la note"));
    expect(host.textContent).toContain("Échec de l'envoi. Réessayez.");
    expect(host.querySelector("audio")).toBeNull();
    await act(async () => { root.render(createElement(Field, { upload: async () => { throw new Error("réseau"); } })); });
    await click(btn("Enregistrer une note vocale")); await click(btn("Envoyer la note"));
    expect(host.textContent).toContain("Échec de l'envoi. Réessayez.");
  });
});

describe("VoiceTextInput — annuler, pause, erreurs", () => {
  it("annuler : rien n'est envoyé, le micro est libéré, le champ revient", async () => {
    const upload = vi.fn(async () => "u");
    await mountField(upload);
    await click(btn("Enregistrer une note vocale"));
    await click(btn("Annuler"));
    expect(upload).not.toHaveBeenCalled(); expect(stopped).toHaveBeenCalled();
    expect(host.querySelector("textarea")).not.toBeNull();
  });
  it("pause puis reprise : le MediaRecorder est suspendu puis relancé, le libellé du bouton suit", async () => {
    await mountField(async () => null);
    await click(btn("Enregistrer une note vocale"));
    await click(btn("Pause"));
    expect(recorders[0].paused).toBe(1);
    expect(btn("Reprendre")).not.toBeNull();
    await click(btn("Reprendre"));
    expect(recorders[0].resumed).toBe(1);
    expect(btn("Pause")).not.toBeNull();
  });
  it("le minuteur avance d'une seconde par seconde, figé en pause", async () => {
    vi.useFakeTimers();
    await mountField(async () => null);
    await act(async () => { btn("Enregistrer une note vocale")!.click(); await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(host.textContent).toContain("0:03");
    await act(async () => { btn("Pause")!.click(); });
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(host.textContent).toContain("0:03");
    await act(async () => { btn("Reprendre")!.click(); });
    await act(async () => { vi.advanceTimersByTime(62000); });
    expect(host.textContent).toContain("1:05");
  });
  it("accès refusé : message, micro libéré, champ intact", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("denied"));
    await mountField(async () => null);
    await click(btn("Enregistrer une note vocale"));
    expect(host.textContent).toContain("Accès micro refusé. Autorisez le microphone.");
    expect(host.querySelector("textarea")).not.toBeNull();
  });
  it("navigateur sans micro ou sans MediaRecorder : « Micro indisponible sur ce navigateur. », aucune demande d'accès", async () => {
    const gum = navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>;
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder;
    await mountField(async () => null);
    await click(btn("Enregistrer une note vocale"));
    expect(host.textContent).toContain("Micro indisponible sur ce navigateur.");
    expect(gum).not.toHaveBeenCalled();
  });
  it("démonter pendant l'enregistrement libère le micro", async () => {
    await mountField(async () => null);
    await click(btn("Enregistrer une note vocale"));
    await act(async () => { root.render(createElement("div")); });
    expect(stopped).toHaveBeenCalled();
  });
  it("le texte se saisit comme dans un champ ordinaire", async () => {
    await mountField(async () => null);
    const ta = host.querySelector("textarea")!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(ta, "sans oignon"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(host.querySelector("textarea")!.value).toBe("sans oignon");
  });
});

describe("VoiceRecordingBar", () => {
  it("minuteur m:ss, actions nommées, pause et reprise", async () => {
    const [onCancel, onPause, onSend] = [vi.fn(), vi.fn(), vi.fn()];
    await act(async () => { root.render(createElement(VoiceRecordingBar, { elapsed: 125, paused: false, onCancel, onTogglePause: onPause, onSend })); });
    expect(host.textContent).toContain("2:05");
    await click(btn("Annuler")); await click(btn("Pause")); await click(btn("Envoyer la note"));
    expect([onCancel, onPause, onSend].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
    await act(async () => { root.render(createElement(VoiceRecordingBar, { elapsed: 0, paused: true, onCancel, onTogglePause: onPause, onSend })); });
    expect(btn("Reprendre")).not.toBeNull();
    expect(host.querySelectorAll("span[style*='omni-wave']")).toHaveLength(30);
    expect(host.querySelector<HTMLElement>("span[style*='omni-wave']")!.style.animationPlayState).toBe("paused");
  });
});

describe("VoicePlayer", () => {
  const audio = () => host.querySelector("audio")!;
  const meta = (a: HTMLAudioElement, duration: number) => { Object.defineProperty(a, "duration", { configurable: true, value: duration }); };
  it("durée connue : minutage, lecture, pause", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    await act(async () => { root.render(createElement(VoicePlayer, { src: "https://x.test/v.webm" })); });
    meta(audio(), 75);
    await act(async () => { audio().dispatchEvent(new Event("loadedmetadata")); });
    expect(host.textContent).toContain("1:15");
    expect(host.querySelector("[role=slider]")?.getAttribute("aria-valuemax")).toBe("75");
    await click(btn("Lire la note vocale"));
    expect(play).toHaveBeenCalled();
    expect(btn("Pause")).not.toBeNull();
    Object.defineProperty(audio(), "paused", { configurable: true, value: false });
    await click(btn("Pause"));
    expect(pause).toHaveBeenCalled();
  });
  it("clic dans la barre : saut proportionnel", async () => {
    await act(async () => { root.render(createElement(VoicePlayer, { src: "https://x.test/v.webm" })); });
    meta(audio(), 100);
    await act(async () => { audio().dispatchEvent(new Event("loadedmetadata")); });
    const bar = host.querySelector<HTMLElement>("[role=slider]")!;
    bar.getBoundingClientRect = () => ({ left: 10, width: 200, top: 0, right: 210, bottom: 6, height: 6, x: 10, y: 0, toJSON: () => ({}) });
    await act(async () => { bar.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 110 })); });
    expect(audio().currentTime).toBe(50);
    await act(async () => { bar.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 900 })); });
    expect(audio().currentTime).toBe(100);
  });
  it("durée Infinity (blob webm de Chrome) : saut en fin de piste pour obtenir la vraie durée, retour à 0", async () => {
    await act(async () => { root.render(createElement(VoicePlayer, { src: "https://x.test/v.webm" })); });
    const a = audio();
    meta(a, Infinity);
    await act(async () => { a.dispatchEvent(new Event("loadedmetadata")); });
    expect(a.currentTime).toBe(1e101);
    meta(a, 42);
    await act(async () => { a.dispatchEvent(new Event("timeupdate")); });
    expect(a.currentTime).toBe(0);
    await act(async () => { a.dispatchEvent(new Event("timeupdate")); }); // le retour à 0 émet son propre timeupdate dans un navigateur
    expect(host.textContent).toContain("0:42");
  });
  it("changer de source remet tout à zéro ; sans durée : 0:00 et clic sans effet", async () => {
    await act(async () => { root.render(createElement(VoicePlayer, { src: "https://x.test/a.webm" })); });
    meta(audio(), 30);
    await act(async () => { audio().dispatchEvent(new Event("loadedmetadata")); });
    expect(host.textContent).toContain("0:30");
    await act(async () => { root.render(createElement(VoicePlayer, { src: "https://x.test/b.webm" })); });
    expect(host.textContent).toContain("0:00");
  });
  it("compact et light changent la taille du bouton et inversent les couleurs, sans couleur en dur", async () => {
    await act(async () => { root.render(createElement(VoicePlayer, { src: "x", compact: true })); });
    expect(btn("Lire la note vocale")!.style.width).toBe("30px");
    await act(async () => { root.render(createElement(VoicePlayer, { src: "x", light: true })); });
    expect(btn("Lire la note vocale")!.style.width).toBe("36px");
    expect(btn("Lire la note vocale")!.style.background).toContain("var(--o-bg");
  });
});

describe("VoiceMessage", () => {
  const audio = () => host.querySelector("audio")!;
  const mount = (props: Partial<Parameters<typeof VoiceMessage>[0]> = {}) => act(async () => { root.render(createElement(VoiceMessage, { src: "https://x.test/v.webm", durationSec: 65, ...props })); });
  it("durée annoncée, 40 barres, avatar injecté, pastille micro", async () => {
    await mount({ avatar: createElement("i", { id: "av" }) });
    expect(host.querySelector(".omni-aud-t")?.textContent).toBe("1:05");
    expect(host.querySelectorAll(".omni-aud-w i")).toHaveLength(40);
    expect(host.querySelector("#av")).not.toBeNull();
    expect(host.querySelector(".omni-vn-badge svg")).not.toBeNull();
    expect(host.querySelector(".omni-vn")?.hasAttribute("data-mine")).toBe(false);
  });
  it("envoyé (`mine`) : marque la bulle ; icône utilisateur par défaut, avatar de l'expéditeur injectable", async () => {
    await mount({ mine: true });
    expect(host.querySelector(".omni-vn")?.hasAttribute("data-mine")).toBe(true);
    expect(host.querySelector(".omni-vn-av svg")).not.toBeNull();
    await mount({ mine: true, mineAvatar: createElement("b", { id: "me" }) });
    expect(host.querySelector("#me")).not.toBeNull();
  });
  it("la durée réelle remplace l'annoncée ; pendant la lecture, le temps RESTANT ; fin : remise à zéro", async () => {
    await mount();
    Object.defineProperty(audio(), "duration", { configurable: true, value: 30 });
    await act(async () => { audio().dispatchEvent(new Event("loadedmetadata")); });
    expect(host.querySelector(".omni-aud-t")?.textContent).toBe("0:30");
    await act(async () => { audio().dispatchEvent(new Event("play")); });
    audio().currentTime = 12.2;
    await act(async () => { audio().dispatchEvent(new Event("timeupdate")); });
    expect(host.querySelector(".omni-aud-t")?.textContent).toBe("0:18");
    expect(btn("Pause")).not.toBeNull();
    await act(async () => { audio().dispatchEvent(new Event("ended")); });
    expect(host.querySelector(".omni-aud-t")?.textContent).toBe("0:30");
    expect(btn("Lecture")).not.toBeNull();
  });
  it("durée infinie ou nulle ignorée (durée annoncée gardée)", async () => {
    await mount();
    Object.defineProperty(audio(), "duration", { configurable: true, value: Infinity });
    await act(async () => { audio().dispatchEvent(new Event("loadedmetadata")); });
    expect(host.querySelector(".omni-aud-t")?.textContent).toBe("1:05");
  });
  it("onde au clavier : ± 5 s, bornée ; focusable ; valeur lue « m:ss sur m:ss »", async () => {
    await mount({ durationSec: 20 });
    const wave = host.querySelector<HTMLElement>("[role=slider]")!;
    expect(wave.tabIndex).toBe(0);
    const key = (k: string) => act(async () => { wave.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); });
    await key("ArrowRight"); expect(audio().currentTime).toBe(5);
    await key("ArrowRight"); await key("ArrowRight"); await key("ArrowRight"); await key("ArrowRight"); expect(audio().currentTime).toBe(20);
    await key("ArrowLeft"); expect(audio().currentTime).toBe(15);
    expect(wave.getAttribute("aria-valuetext")).toBe("0:15 sur 0:20");
    await key("Home"); expect(audio().currentTime).toBe(15);
  });
  it("clic dans l'onde : saut proportionnel à la durée ; la même graine donne la même onde, une autre graine une autre", async () => {
    await mount({ durationSec: 100, seed: "a" });
    const heights = () => [...host.querySelectorAll<HTMLElement>(".omni-aud-w i")].map((i) => i.style.height).join();
    const first = heights();
    const wave = host.querySelector<HTMLElement>("[role=slider]")!;
    wave.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, right: 200, bottom: 28, height: 28, x: 0, y: 0, toJSON: () => ({}) });
    await act(async () => { wave.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50 })); });
    expect(audio().currentTime).toBe(25);
    await mount({ durationSec: 100, seed: "a" }); expect(heights()).toBe(first);
    await mount({ durationSec: 100, seed: "b" }); expect(heights()).not.toBe(first);
  });
});

describe("startRecording et fonctions pures", () => {
  it("choisit le premier codec pris en charge (mp4 ici), arrête et rend la note avec sa durée, libère le micro", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const rec = await startRecording();
    expect(recorders[0].opts).toEqual({ mimeType: "audio/mp4" });
    vi.setSystemTime(Date.now() + 3000);
    const out = await rec.stop();
    expect(out.blob.type).toBe("audio/mp4");
    expect(out.durationSec).toBeGreaterThan(2.9);
    expect(stopped).toHaveBeenCalled();
  });
  it("sans codec reconnu : MediaRecorder sans option, type par défaut audio/webm", async () => {
    FakeRecorder.isTypeSupported = () => false;
    FakeRecorder.reported = "";
    const rec = await startRecording();
    expect(recorders[0].opts).toBeUndefined();
    expect((await rec.stop()).blob.type).toBe("audio/webm");
    FakeRecorder.reported = "audio/mp4";
    FakeRecorder.isTypeSupported = (t: string) => t === "audio/mp4";
  });
  it("cancel : rien n'est rendu, micro libéré", async () => {
    const rec = await startRecording();
    rec.cancel();
    expect(stopped).toHaveBeenCalled();
  });
  it("accès refusé : startRecording rejette", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("denied"));
    await expect(startRecording()).rejects.toThrow("denied");
  });
  it("voiceSupported : micro ET MediaRecorder exigés", () => {
    expect(voiceSupported()).toBe(true);
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder;
    expect(voiceSupported()).toBe(false);
  });
  it("note envoyable : au moins 0,5 s et un fichier non vide (règle de ChatComposer de CLP)", () => {
    expect(MIN_VOICE_SECONDS).toBe(0.5);
    expect(isUsableRecording(0.5, 1)).toBe(true);
    expect(isUsableRecording(0.49, 1000)).toBe(false);
    expect(isUsableRecording(5, 0)).toBe(false);
  });
  it("blobToBase64 : sans l'en-tête data:", async () => {
    expect(await blobToBase64(new Blob(["ABC"]))).toBe("QUJD");
  });
});
