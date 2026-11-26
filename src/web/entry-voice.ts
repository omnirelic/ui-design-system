// Sous-export `@omnirelic/ui-design-system/voice` : notes vocales (champ avec micro, barre d'enregistrement, lecteur, message vocal) et leurs fonctions pures (durée, codec, onde, enregistreur).
// Le téléversement est injecté (`VoiceTextInput.onUpload`) : aucun service ni clé dans le paquet.
export { VoiceTextInput } from "./VoiceTextInput";
export type { VoiceTextInputProps } from "./VoiceTextInput";
export { VoiceRecordingBar } from "./VoiceRecordingBar";
export type { VoiceRecordingBarProps } from "./VoiceRecordingBar";
export { VoicePlayer } from "./VoicePlayer";
export type { VoicePlayerProps } from "./VoicePlayer";
export { VoiceMessage } from "./VoiceMessage";
export type { VoiceMessageProps } from "./VoiceMessage";
export { MIN_VOICE_SECONDS, blobToBase64, formatDuration, isUsableRecording, pickMime, startRecording, voiceSupported } from "./voice";
export type { Recording } from "./voice";
export { BARS, SPEEDS, nextSpeed, seekRatio, speedLabel, waveBars } from "./voice-wave";
