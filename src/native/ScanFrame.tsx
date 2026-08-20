/**
 * Caméra de scan ENCADRÉE et compacte (≠ plein écran) : cadre à coins + ligne de
 * scan animée en DÉGRADÉ OMNI (teal→sky), identique à l'app livreur. Pendant l'attente
 * d'un verdict serveur, passer `status` (ex. « Validation… ») met en pause la capture
 * et affiche le message. Le debounce/anti-rescan reste géré par le parent.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, AppState, Easing, StyleSheet, Text, View } from "react-native";
import { Pressable } from "./Pressable";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "./theme";

// Accent commun aux 2 apps : dégradé omni teal→sky.
export const SCAN_TEAL = "#5eead4";
export const SCAN_SKY = "#38bdf8";

export function ScanFrame({
  size = 230,
  onScan,
  active = true,
  status,
}: {
  size?: number;
  onScan: (data: string) => void;
  active?: boolean;
  /** Message d'attente (Chargement/Authentification/Validation). Présent = capture en pause. */
  status?: string;
}) {
  const [perm, requestPerm] = useCameraPermissions();
  const y = useRef(new Animated.Value(0)).current;
  const paused = !active || !!status;

  // Clé de remontage de la caméra. Android laisse souvent la CameraView NOIRE
  // après un retour d'arrière-plan (verrouillage, app en fond) : on la remonte
  // à chaque passage au premier plan, et manuellement via « Relancer ».
  const [camKey, setCamKey] = useState(0);
  const restart = () => setCamKey((k) => k + 1);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") restart();
    });
    return () => sub.remove();
  }, []);

  // Demande la permission automatiquement si on peut encore (évite de rester
  // bloqué sur l'écran « Autoriser » alors qu'aucune boîte système n'apparaît).
  useEffect(() => {
    if (perm && !perm.granted && perm.canAskAgain) requestPerm();
  }, [perm, requestPerm]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [y]);

  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [8, size - 8] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {!perm ? (
        <Text style={styles.hint}>Initialisation caméra…</Text>
      ) : !perm.granted ? (
        <Pressable style={styles.permBtn} onPress={requestPerm}>
          <Text style={styles.permText}>Autoriser la caméra</Text>
        </Pressable>
      ) : (
        <>
          <CameraView
            key={camKey}
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={paused ? undefined : ({ data }) => onScan(data)}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.corner, styles.tl, { borderColor: SCAN_TEAL }]} />
            <View style={[styles.corner, styles.tr, { borderColor: SCAN_TEAL }]} />
            <View style={[styles.corner, styles.bl, { borderColor: SCAN_SKY }]} />
            <View style={[styles.corner, styles.br, { borderColor: SCAN_SKY }]} />
            {!paused && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
                <LinearGradient
                  colors={[SCAN_TEAL, SCAN_SKY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
          </View>
          {!status && (
            <Pressable style={styles.restart} onPress={restart} hitSlop={8}>
              <Text style={styles.restartText}>↻ Relancer la caméra</Text>
            </Pressable>
          )}
          {!!status && (
            <View style={styles.statusOverlay}>
              <ActivityIndicator color={SCAN_TEAL} />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const C = 26;
const corner = { position: "absolute" as const, width: C, height: C };
const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: "hidden", backgroundColor: "#000", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  corner,
  tl: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  scanLine: { position: "absolute", left: 14, right: 14, height: 2, borderRadius: 2, overflow: "hidden", shadowColor: SCAN_SKY, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  statusOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.62)", gap: 10 },
  statusText: { color: theme.text, fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  restart: { position: "absolute", bottom: 8, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  restartText: { color: SCAN_TEAL, fontSize: 12, fontWeight: "700" },
  hint: { color: theme.dim, fontSize: 13 },
  permBtn: { backgroundColor: SCAN_TEAL, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18 },
  permText: { color: "#06181c", fontWeight: "800", fontSize: 14 },
});
