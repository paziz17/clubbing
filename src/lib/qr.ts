import QRCode from "qrcode";

export async function makeQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    color: { dark: "#D4AF37", light: "#06060A" },
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

export async function makeQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    color: { dark: "#D4AF37", light: "#06060A" },
    width: 320,
    margin: 1,
  });
}
