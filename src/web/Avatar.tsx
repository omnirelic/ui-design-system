// Avatar identité — initiales en dégradé accent par défaut, image uploadée
// une fois choisie. `onPickFile` rend l'avatar cliquable et affiche un badge
// caméra en survol (upload de logo partenaire/business) ; omis, l'avatar
// reste un simple indicateur d'identité non interactif.
import { useId, useRef, type ChangeEvent, type ReactNode } from "react";
import { FONT } from "./theme";
import { radius } from "../tokens";

export type AvatarProps = {
  initials: string;
  imageUrl?: string | null;
  size?: number;
  onPickFile?: (file: File) => void;
  /** Icône affichée en survol quand `onPickFile` est fourni (ex. `<Camera />` de @phosphor-icons/react) — le package reste agnostique du set d'icônes choisi par l'app. */
  editIcon?: ReactNode;
};

export function Avatar({ initials, imageUrl, size = 58, onPickFile, editIcon }: AvatarProps) {
  const gid = useId().replace(/:/g, "");
  const cls = `omni-avatar-${gid}`;
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPickFile?.(file);
    e.target.value = "";
  }

  const body = (
    <div
      className={onPickFile ? cls : undefined}
      style={{
        position: "relative", width: size, height: size, borderRadius: radius.lg, overflow: "hidden",
        background: imageUrl ? undefined : "linear-gradient(135deg,#5eead4,#22b8a0)",
        color: "#04211c", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: FONT.xxl, fontWeight: 800, fontFamily: "Space Grotesk, monospace",
        cursor: onPickFile ? "pointer" : undefined, flex: "0 0 auto",
      }}
      onClick={onPickFile ? () => inputRef.current?.click() : undefined}
      role={onPickFile ? "button" : undefined}
      title={onPickFile ? "Changer le logo" : undefined}
    >
      {imageUrl ? <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
      {onPickFile && (
        <>
          <style>{`
            .${cls} .omni-avatar-edit-badge { opacity: 0; transition: opacity 120ms ease; }
            .${cls}:hover .omni-avatar-edit-badge { opacity: 1; }
          `}</style>
          <span
            className="omni-avatar-edit-badge"
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,.55)", fontSize: FONT.lg, color: "#fff",
            }}
          >
            {editIcon}
          </span>
        </>
      )}
    </div>
  );

  if (!onPickFile) return body;
  return (
    <>
      {body}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
    </>
  );
}
