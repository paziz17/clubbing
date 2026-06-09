import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { makeQrDataUrl } from "@/lib/qr";
import { formatCredits, formatILS } from "@/lib/utils";
import { VoucherCountdown } from "./voucher-countdown";

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voucher = await db.voucher.findUnique({
    where: { id },
    include: { venue: true },
  });
  if (!voucher) notFound();

  const qr = await makeQrDataUrl(voucher.qrPayload);
  const value = formatILS(voucher.amountAgorot);

  return (
    <div className="mobile-screen pb-10 flex flex-col">
      <div className="px-5 pt-10 pb-3 text-center">
        <p className="text-xs text-ink-muted">מימוש בבר · {voucher.venue.name}</p>
        <h1 className="font-display text-3xl text-gold mb-2 mt-2">קוד וצ'ר</h1>
      </div>

      <div className="mx-5 my-3 rounded-2xl border-2 border-gold bg-bg-soft p-8 text-center">
        <div className="font-mono text-3xl text-gold-gradient tracking-widest font-semibold mb-2">
          {voucher.code}
        </div>
        <div className="text-sm text-ink-muted">שווה ל-{value}</div>
      </div>

      <div className="flex justify-center my-4">
        <div className="relative">
          {/* corner brackets */}
          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-gold" />
          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-gold" />
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-gold" />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-gold" />
          <img src={qr} alt="QR" width={260} height={260} className="rounded-lg" />
        </div>
      </div>

      <div className="text-center text-sm text-ink-muted">
        <VoucherCountdown expiresAt={voucher.expiresAt.toISOString()} />
      </div>

      <div className="px-5 mt-6 grid grid-cols-3 gap-2">
        <BrightnessButton />
        <button className="btn-ghost h-11 text-xs">שיתוף</button>
        <button className="btn-ghost h-11 text-xs">ביטול</button>
      </div>

      <p className="text-center text-xs text-ink-dim mt-6 px-8 leading-relaxed">
        הצג/י את הקוד או ה-QR לבר־מן/ית במועדון.
        <br />
        הקוד חד פעמי ותקף 24 שעות.
      </p>
    </div>
  );
}

function BrightnessButton() {
  return (
    <button
      className="btn-ghost h-11 text-xs"
      onClick={() => {
        if (typeof document !== "undefined") {
          document.body.style.filter = "brightness(1.5)";
          setTimeout(() => (document.body.style.filter = ""), 30000);
        }
      }}
    >
      ✦ בהירות
    </button>
  );
}
