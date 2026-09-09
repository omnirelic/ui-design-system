// Confirmation légère empilée en bas d'écran (mockup: .toast-stack) —
// `ToastProvider` monté une fois à la racine de l'app hôte, `useToast()`
// donne juste `toast(message)`. Pas de queue ni de types succès/erreur
// distincts pour l'instant — tout le réseau n'utilise que la confirmation
// neutre à ce jour (voir mockups), pas la peine d'anticiper.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CARD, BORDER, TXT, FONT } from "./theme";
import { semantic } from "../tokens";

type ToastEntry = { id: number; message: string };

const ToastContext = createContext<((message: string) => void) | null>(null);

export function useToast(): (message: string) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  const toast = useCallback((message: string) => {
    const id = ++seq;
    setEntries((prev) => [...prev, { id, message }]);
    setTimeout(() => setEntries((prev) => prev.filter((e) => e.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", left: "50%", bottom: 18, transform: "translateX(-50%)", zIndex: 80, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        {entries.map((e) => (
          <div
            key={e.id}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999,
              background: CARD, border: `1px solid ${BORDER}`, color: TXT, fontSize: FONT.base, fontWeight: 700,
              boxShadow: "0 10px 30px rgba(0,0,0,.5)",
            }}
          >
            <span style={{ color: semantic.success }}>✓</span>
            {e.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
