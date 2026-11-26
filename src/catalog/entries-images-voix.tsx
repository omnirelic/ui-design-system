// Entrées du lot « images, preuves et notes vocales » (portées de Chez la Petite). Aucune photo ni voix réelle : images et son fabriqués en ligne (données `data:`), aucun réseau.
import { FileInput, MAX_PROOF_BYTES, MediaFit, PhotoThumb, Thumbnail, ImageThumb, UploadError, cdnUrl, cdnUrlWatermarked, checkProofFile, compressedName, matchesAccept, mediaDownloadUrl, mediaViewUrl, scaledSize, sortGallery } from "../web/entry-images";
import { PHOTO_PARAM, PhotoLink, ProofField } from "../web/entry-image-gallery";
import { BARS, MIN_VOICE_SECONDS, SPEEDS, VoiceMessage, VoicePlayer, VoiceRecordingBar, VoiceTextInput, formatDuration, isUsableRecording, nextSpeed, pickMime, seekRatio, speedLabel, waveBars } from "../web/entry-voice";
import { Controlled, choices, noop } from "./live";
import type { CatalogEntrySourceInterface, CatalogExampleInterface } from "./types";

const ex = (call: string, result: unknown): CatalogExampleInterface => ({ call, result: typeof result === "string" ? result : JSON.stringify(result) });

/** Image carrée fabriquée en ligne : le catalogue n'appelle aucun réseau. */
const PIC = (hue: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="hsl(${hue} 40% 45%)"/><circle cx="80" cy="64" r="26" fill="white" opacity=".6"/></svg>`)}`;
/** Fichier audio de synthèse : un silence de quelques millisecondes. */
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=";
const CLD = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";

export const IMAGES_VOIX_ENTRIES: CatalogEntrySourceInterface[] = [
  { name: "ImageThumb", group: "images", kind: "component", render: () => <div style={{ width: 120 }}><ImageThumb src={PIC(30)} alt="Photo d'exemple" onOpen={noop} /></div> },
  { name: "PhotoThumb", group: "images", kind: "component", states: choices(["plain", "Simple"], ["removable", "Avec croix"]), render: (_v, state) => <PhotoThumb src={PIC(200)} alt="Photo d'exemple" size={64} onRemove={state === "removable" ? noop : undefined} /> },
  { name: "Thumbnail", group: "images", kind: "component", states: choices(["image", "Image"], ["empty", "Sans image"]), render: (_v, state) => <Thumbnail src={state === "image" ? PIC(120) : null} size={56} /> },
  {
    name: "MediaFit", group: "images", kind: "component",
    states: choices(["image", "Image"], ["emoji", "Emoji de contenu"], ["empty", "Vide"]),
    render: (_v, state) => <div style={{ width: 160, height: 100 }}><MediaFit url={state === "image" ? PIC(300) : null} alt="Plat" w={160} h={100} emoji={state === "emoji" ? "\u{1F372}" : undefined} /></div>,
  },
  {
    name: "FileInput", group: "images", kind: "component",
    render: () => <label style={{ display: "inline-block", padding: "8px 14px", border: "1px dashed currentColor", borderRadius: 8, cursor: "pointer" }}>Parcourir<FileInput accept="image/*" onChange={noop} /></label>,
  },
  {
    name: "PhotoLink", group: "images", kind: "component",
    render: () => <PhotoLink url={PIC(60)} label="Agrandir la capture">capture</PhotoLink>,
  },
  {
    name: "ProofField", group: "images", kind: "component", wide: true,
    states: choices(["empty", "Vide"], ["uploading", "Envoi"], ["done", "Photo prête"], ["error", "Erreur"]),
    render: (_v, state) => <ProofField url={state === "done" ? PIC(10) : null} uploading={state === "uploading"} error={state === "error" ? "Échec de l'envoi de la photo — réessayez." : ""} onPick={noop} addLabel="Ajouter la capture" tip="Capture du paiement" clear={state === "done" ? noop : undefined} />,
  },
  { name: "PHOTO_PARAM", group: "images", kind: "constant", examples: () => [ex("PHOTO_PARAM", PHOTO_PARAM)] },
  { name: "MAX_PROOF_BYTES", group: "images", kind: "constant", examples: () => [ex("MAX_PROOF_BYTES", MAX_PROOF_BYTES)] },
  {
    name: "checkProofFile", group: "images", kind: "function",
    examples: () => [["image/jpeg", 1_000_000], ["application/pdf", 1000], ["image/png", MAX_PROOF_BYTES + 1], ["image/png", 0]].map(([type, size]) => ex(`checkProofFile({ type: "${type}", size: ${size} })`, checkProofFile({ type: type as string, size: size as number }))),
  },
  {
    name: "matchesAccept", group: "images", kind: "function",
    examples: () => [["capture.png", "image/png", "image/*"], ["contrat.pdf", "application/pdf", "image/*"], ["CV.DOCX", "", ".pdf,.doc,.docx"], ["note.webm", "audio/webm", "audio/*,video/*"]].map(([name, type, accept]) => ex(`matchesAccept({ name: "${name}", type: "${type}" }, "${accept}")`, matchesAccept({ name, type }, accept))),
  },
  { name: "mediaViewUrl", group: "images", kind: "function", examples: () => [CLD, "https://example.com/photo.png"].map((u) => ex(`mediaViewUrl("${u}")`, mediaViewUrl(u))) },
  { name: "mediaDownloadUrl", group: "images", kind: "function", examples: () => [CLD, "https://example.com/photo.png"].map((u) => ex(`mediaDownloadUrl("${u}")`, mediaDownloadUrl(u))) },
  { name: "cdnUrl", group: "images", kind: "function", examples: () => [ex(`cdnUrl("${CLD}", 80, 80)`, cdnUrl(CLD, 80, 80)), ex(`cdnUrl("https://example.com/photo.png", 80, 80)`, cdnUrl("https://example.com/photo.png", 80, 80)), ex("cdnUrl(null, 80, 80)", cdnUrl(null, 80, 80))] },
  { name: "cdnUrlWatermarked", group: "images", kind: "function", examples: () => [ex(`cdnUrlWatermarked("${CLD}", 300, 200, { text: "Ma Cuisine", color: "FFFFFF" })`, cdnUrlWatermarked(CLD, 300, 200, { text: "Ma Cuisine", color: "FFFFFF" }))] },
  {
    name: "sortGallery", group: "images", kind: "function",
    examples: () => [ex("sortGallery([c 10h, a 8h, z sans date, b 8h]).map(id)", sortGallery([{ id: "c", at: "2026-10-28T10:00:00Z" }, { id: "a", at: "2026-10-28T08:00:00Z" }, { id: "z" }, { id: "b", at: "2026-10-28T08:00:00Z" }]).map((i) => i.id))],
  },
  { name: "scaledSize", group: "images", kind: "function", examples: () => [[4000, 3000, 1600], [3000, 4000, 1600], [800, 600, 1600]].map(([w, h, m]) => ex(`scaledSize(${w}, ${h}, ${m})`, scaledSize(w, h, m))) },
  { name: "compressedName", group: "images", kind: "function", examples: () => [["IMG_0001.HEIC", true], ["capture.final.webp", false], ["sans-extension", true]].map(([n, j]) => ex(`compressedName("${n}", ${j})`, compressedName(n as string, j as boolean))) },
  { name: "UploadError", group: "images", kind: "class", examples: () => (["not_configured", "network", "rejected", "aborted"] as const).map((c) => ex(`new UploadError("${c}")`, { name: new UploadError(c).name, code: new UploadError(c).code })) },

  { name: "BARS", group: "voix", kind: "constant", examples: () => [ex("BARS", BARS)] },
  { name: "SPEEDS", group: "voix", kind: "constant", examples: () => [ex("SPEEDS", [...SPEEDS])] },
  { name: "MIN_VOICE_SECONDS", group: "voix", kind: "constant", examples: () => [ex("MIN_VOICE_SECONDS", MIN_VOICE_SECONDS)] },
  { name: "VoiceRecordingBar", group: "voix", kind: "component", states: choices(["running", "En cours"], ["paused", "En pause"]), render: (_v, state) => <VoiceRecordingBar elapsed={state === "running" ? 7 : 83} paused={state === "paused"} onCancel={noop} onTogglePause={noop} onSend={noop} /> },
  {
    name: "VoicePlayer", group: "voix", kind: "component", variants: choices(["normal", "Normal"], ["compact", "Compact"], ["light", "Sur fond clair"]),
    render: (variant) => <div style={{ width: 280, ...(variant === "light" ? { padding: 8, background: "var(--o-accent, #5eead4)" } : null) }}><VoicePlayer src={SILENCE} compact={variant === "compact"} light={variant === "light"} /></div>,
  },
  {
    name: "VoiceMessage", group: "voix", kind: "component", states: choices(["received", "Reçu"], ["sent", "Envoyé"]),
    render: (_v, state) => <div style={{ padding: 8, borderRadius: 12, width: 280, background: state === "sent" ? "var(--o-accent, #5eead4)" : "var(--o-card, #18181b)" }}><VoiceMessage src={SILENCE} durationSec={65} seed={`exemple-${state}`} mine={state === "sent"} meta={<span style={{ fontSize: 12 }}>14:05</span>} /></div>,
  },
  {
    name: "VoiceTextInput", group: "voix", kind: "component", inert: true, wide: true,
    render: () => (
      <Controlled<{ text: string; voice: string | null }> initial={{ text: "", voice: null }}>
        {(v, set) => <VoiceTextInput text={v.text} onTextChange={(text) => set({ ...v, text })} voiceUrl={v.voice} onVoiceChange={(voice) => set({ ...v, voice })} onUpload={async () => null} />}
      </Controlled>
    ),
  },
  { name: "formatDuration", group: "voix", kind: "function", examples: () => [0, 0.4, 59.5, 65, 125.4, 3600].map((s) => ex(`formatDuration(${s})`, formatDuration(s))) },
  {
    name: "pickMime", group: "voix", kind: "function",
    examples: () => [[], ["audio/mp4"], ["audio/webm", "audio/mp4"], ["audio/webm;codecs=opus", "audio/mp4"], ["audio/wav"]].map((set) => ex(`pickMime((t) => ${JSON.stringify(set)}.includes(t))`, pickMime((t) => set.includes(t)) ?? null)),
  },
  { name: "isUsableRecording", group: "voix", kind: "function", examples: () => [[0.5, 1], [0.49, 1000], [5, 0]].map(([d, s]) => ex(`isUsableRecording(${d}, ${s})`, isUsableRecording(d, s))) },
  { name: "waveBars", group: "voix", kind: "function", examples: () => ["msg-1", "msg-2"].map((s) => ex(`waveBars("${s}", 5).map(h => h.toFixed(2))`, waveBars(s, 5).map((h) => h.toFixed(2)))) },
  { name: "seekRatio", group: "voix", kind: "function", examples: () => [[50, 0, 100], [150, 0, 100], [-20, 0, 100], [30, 10, 0]].map(([x, l, w]) => ex(`seekRatio(${x}, ${l}, ${w})`, seekRatio(x, l, w))) },
  { name: "nextSpeed", group: "voix", kind: "function", examples: () => [1, 1.5, 2].map((s) => ex(`nextSpeed(${s})`, nextSpeed(s))) },
  { name: "speedLabel", group: "voix", kind: "function", examples: () => [1, 1.5, 2].map((s) => ex(`speedLabel(${s})`, speedLabel(s))) },
];
