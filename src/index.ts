// @omnirelic/ui-design-system — identité visuelle omnirelic.
//
// - `tokens.ts` : valeurs brutes (couleurs, typo, radius) — le seul vrai
//   cross-platform, consommable par web ET un futur client React Native.
// - `web/` : composants React DOM (LogoMark, QrCard, InfoRow, PublicShell,
//   PublicHeader) — implémentation web d'aujourd'hui.
// - `native/` : n'existe pas encore. À ajouter quand un client React Native
//   consomme réellement ce package (react-native-svg pour LogoMark/QrCard,
//   View/Text pour PublicShell) — mêmes tokens, rendu différent. Ne pas
//   fabriquer ce dossier avant qu'un vrai besoin mobile n'existe.
export * from "./tokens";
export * from "./web";
