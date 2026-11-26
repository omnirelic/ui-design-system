// @omnirelic/ui-design-system — identité visuelle omnirelic.
//
// - `tokens.ts` : valeurs brutes (couleurs, typo, radius) — le seul vrai
//   cross-platform, consommable par web ET React Native.
// - `web/` : composants React DOM (LogoMark, QrCard, InfoRow, PublicShell,
//   PublicHeader), exportés ici (racine du package).
// - `native/` : composants React Native (LogoMark/Logo/Pressable/Icon/
//   ScanFrame — voir omnirelic/mobile), sous-export DÉDIÉ `@omnirelic/
//   ui-design-system/native`, JAMAIS réexporté ici : un consommateur web ne
//   doit jamais tirer react-native/react-native-svg/expo-* en important la
//   racine du package, et réciproquement.
export * from "./tokens";
export * from "./web";
