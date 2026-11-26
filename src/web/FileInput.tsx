// Entrée fichier cachée (web/src/ui/FileInput.tsx de CLP), déclenchée par un <label> ou un bouton. Accepte aussi le glisser-déposer et le collage (Ctrl/⌘ V) d'un fichier :
// le `onChange` du champ reçoit exactement ce qu'un clic sur « Parcourir » lui donnerait (`accept` et `multiple` respectés).
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { InputHTMLAttributes, RefObject } from "react";
import { attachFileDrop } from "./file-drop";
import "./file-drop-css";

export interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style"> {
  /** Zone qui reçoit le glisser-déposer (défaut : le <label> qui entoure l'input, sinon son parent). */
  dropTarget?: RefObject<HTMLElement | null>;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput({ dropTarget, ...props }, ref) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLInputElement);
  useEffect(() => {
    const input = inner.current;
    const target = dropTarget?.current ?? input?.closest("label") ?? input?.parentElement;
    if (!input || !target) return;
    return attachFileDrop(input, target as HTMLElement);
  }, [dropTarget]);
  return <input ref={inner} type="file" style={{ display: "none" }} {...props} />;
});
