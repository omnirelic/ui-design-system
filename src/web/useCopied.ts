// État « copié » et écriture du presse-papiers de l'admin de CLP (web/src/admin/ui/useCopied.ts), repris tel quel.
import { useCallback, useEffect, useRef, useState } from "react";

/** Copie dans le presse-papiers (texte immédiat ou différé, ex. donnée à aller chercher), avec repli `execCommand` quand l'API async est absente ou refusée
 *  (contexte non sécurisé, iframe, permission). Renvoie true si le texte est bien copié. */
export async function writeClipboard(input: string | Promise<string>): Promise<boolean> {
  // Texte différé : un ClipboardItem accepte la promesse tel quel, ce qui garde le geste utilisateur
  // (Safari/Chrome refusent sinon l'écriture après un `await` réseau). Échec → repli classique ci-dessous.
  if (typeof input !== "string" && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": input.then((t) => new Blob([t], { type: "text/plain" })) })]);
      return true;
    } catch { /* repli ci-dessous */ }
  }
  let text: string;
  try { text = await input; } catch { return false; }
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* repli ci-dessous */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

/** État « copié » partagé par tous les boutons de copie : `copied` reste vrai 1,8 s. */
export function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(async (text: string | Promise<string>) => {
    const ok = await writeClipboard(text);
    if (!ok) return false;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
    return true;
  }, []);
  return { copied, copy };
}
