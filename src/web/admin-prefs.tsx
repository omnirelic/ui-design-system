// Préférences d'affichage de l'espace admin, mémorisées par appareil (web/src/admin/lib/prefs.tsx de Chez la Petite) : taille du texte (A- / A / A+ / A++), menu de gauche replié,
// mode immersif d'une vue. Le stockage est celui du navigateur, jamais bloquant ; les clés se préfixent par application (`storagePrefix`).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type FontScale = "sm" | "md" | "lg" | "xl";

/** Pourcentage de base appliqué à la racine : tout ce qui est en rem (texte, boutons, champs) suit. */
export const FONT_SCALE_PCT: Record<FontScale, number> = { sm: 87.5, md: 100, lg: 112.5, xl: 125 };
export const FONT_SCALES: FontScale[] = ["sm", "md", "lg", "xl"];

/** Échelle automatique selon la largeur de la fenêtre : 100 % à partir de 1500 px, puis proportionnelle jusqu'à 85 % ; sous 900 px (mise en page mobile) aucune réduction. */
export const AUTO_SCALE_FULL_WIDTH = 1500;
export const AUTO_SCALE_MIN = 0.85;
export function autoScale(viewportWidth: number): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth < 900) return 1;
  return Math.min(1, Math.max(AUTO_SCALE_MIN, viewportWidth / AUTO_SCALE_FULL_WIDTH));
}
/** Pourcentage final appliqué à la racine (arrondi au dixième : pas de re-rendu à chaque pixel de redimensionnement). */
export const rootPercent = (fontScale: FontScale, viewportWidth: number): number => Math.round(FONT_SCALE_PCT[fontScale] * autoScale(viewportWidth) * 10) / 10;

function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string): void { try { localStorage.setItem(key, value); } catch { /* stockage indisponible : préférence non persistée */ } }

export interface AdminPrefs {
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;
  /** Menu de gauche replié : l'état de vue (mode immersif d'une vue) prime sur le réglage mémorisé de l'appareil. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  /** Mode immersif d'une vue : `true` = menu replié le temps de la visite, `null` = on retrouve le réglage de l'appareil. Jamais mémorisé. */
  setViewCollapsed: (v: boolean | null) => void;
}

const Ctx = createContext<AdminPrefs | null>(null);

export function AdminPrefsProvider({ children, storagePrefix = "omni_admin" }: { children: ReactNode; storagePrefix?: string }) {
  const KEY_SCALE = `${storagePrefix}_font_scale`;
  const KEY_SIDEBAR = `${storagePrefix}_sidebar_collapsed`;
  const [fontScale, setScale] = useState<FontScale>(() => { const saved = read(KEY_SCALE); return saved === "sm" || saved === "lg" || saved === "xl" ? saved : "md"; });
  const [storedCollapsed, setCollapsed] = useState<boolean>(() => read(KEY_SIDEBAR) === "1");
  // État de VUE (jamais écrit dans le stockage) : une vue immersive replie le menu pendant la visite, puis le réglage de l'appareil revient.
  const [viewCollapsed, setViewCollapsed] = useState<boolean | null>(null);
  const sidebarCollapsed = viewCollapsed ?? storedCollapsed;

  // La racine ne change que tant que l'admin est monté (le reste du site garde sa taille).
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.fontSize;
    const apply = () => { root.style.fontSize = `${rootPercent(fontScale, window.innerWidth)}%`; };
    apply();
    window.addEventListener("resize", apply);
    return () => { window.removeEventListener("resize", apply); root.style.fontSize = previous; };
  }, [fontScale]);

  const setFontScale = useCallback((s: FontScale) => { setScale(s); write(KEY_SCALE, s); }, [KEY_SCALE]);
  const setSidebarCollapsed = useCallback((v: boolean) => { setCollapsed(v); write(KEY_SIDEBAR, v ? "1" : "0"); }, [KEY_SIDEBAR]);
  // Pendant une visite immersive, « Agrandir / Réduire » bascule l'état de la visite seulement ; ailleurs il mémorise le réglage de l'appareil.
  const toggleSidebar = useCallback(() => {
    if (viewCollapsed !== null) { setViewCollapsed(!viewCollapsed); return; }
    setCollapsed(prev => { write(KEY_SIDEBAR, prev ? "0" : "1"); return !prev; });
  }, [viewCollapsed, KEY_SIDEBAR]);

  const value = useMemo(() => ({ fontScale, setFontScale, sidebarCollapsed, setSidebarCollapsed, toggleSidebar, setViewCollapsed }), [fontScale, setFontScale, sidebarCollapsed, setSidebarCollapsed, toggleSidebar]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const FALLBACK: AdminPrefs = { fontScale: "md", setFontScale: () => {}, sidebarCollapsed: false, setSidebarCollapsed: () => {}, toggleSidebar: () => {}, setViewCollapsed: () => {} };

/** Hors provider (tests, vues isolées) : valeurs neutres, jamais d'erreur. */
export function useAdminPrefs(): AdminPrefs { return useContext(Ctx) ?? FALLBACK; }

/**
 * Vue immersive : tant que `active`, le menu de gauche est replié (même état que « Agrandir »), à CHAQUE ouverture de la vue. La visite peut rouvrir le menu ;
 * en quittant la vue, le réglage mémorisé de l'appareil revient.
 */
export function useViewImmersion(active: boolean): void {
  const { setViewCollapsed } = useAdminPrefs();
  useEffect(() => {
    if (!active) return;
    setViewCollapsed(true);
    return () => setViewCollapsed(null);
  }, [active, setViewCollapsed]);
}
