// QR carré avec le logo omnirelic animé au centre — même construction que
// HandshakeCode.tsx côté engine web (SVG react-qr-code + overlay rond), et
// QrCodeWithLogo.tsx de CLP (le mark tourne en continu, jamais les modules
// du QR). Composant de référence unique pour toute vue publique /:ns/:id.
import QRCode from "react-qr-code";
import { LogoMark } from "./LogoMark";
import { CARD } from "./theme";

export type QrCardProps = { value: string; size: number };

export function QrCard({ value, size }: QrCardProps) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 12, display: "inline-flex", boxShadow: "0 4px 20px rgba(0,0,0,0.45)", border: `4px solid ${CARD}` }}>
      <div style={{ position: "relative", display: "flex", width: size, height: size }}>
        <QRCode value={value} size={size} bgColor="#ffffff" fgColor="#111111" level="H" />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "30%",
            height: "30%",
            background: "#fff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoMark size={Math.round(size * 0.24)} spin />
        </div>
      </div>
    </div>
  );
}
