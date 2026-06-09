"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Lock } from "lucide-react";
import { formatILS } from "@/lib/utils";
import { PrePaySignupPopup } from "@/components/pre-pay-signup-popup";

interface Event {
  id: string;
  name: string;
  basePriceAgorot: number;
  tickets: {
    id: string;
    kind: string;
    label: string;
    priceAgorot: number;
    stock: number | null;
    benefitsJson: any;
  }[];
}

export function CheckoutFlow({ event }: { event: Event }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [ticketId, setTicketId] = useState(event.tickets[0]?.id);
  const [qty, setQty] = useState(1);
  const [age18, setAge18] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const ticket = event.tickets.find((t) => t.id === ticketId);
  const unit = ticket?.priceAgorot ?? event.basePriceAgorot;
  const subtotal = unit * qty;
  const serviceFee = Math.round(subtotal * 0.05);
  const vat = Math.round((subtotal + serviceFee) * 0.17);
  const total = subtotal + serviceFee + vat;

  async function startPayment(method: string, skippedAuth = false) {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketTypeId: ticket?.id,
          quantity: qty,
          paymentMethod: method,
          skippedAuth,
        }),
      });
      const json = await res.json();
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else if (json.reservationId) {
        router.push(`/tickets/${json.reservationId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePayClick() {
    if (!session?.user || (session.user as any).isGuest) {
      setShowSignup(true);
      return;
    }
    setStep(2);
  }

  return (
    <div className="mobile-screen pb-32">
      <header className="sticky top-0 z-10 glass border-b border-line px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => (step > 1 ? setStep(1) : router.back())}
          className="p-2 -mr-2 rounded-full hover:bg-bg-soft"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1">
          <div className="text-xs text-ink-muted">תשלום · שלב {step} מתוך 2</div>
          <div className="text-sm text-ink truncate">{event.name}</div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 pt-6 space-y-5"
          >
            <div>
              <h2 className="font-display text-xl text-gold mb-3">בחר/י סוג כרטיס</h2>
              <div className="space-y-2">
                {event.tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTicketId(t.id)}
                    className={`w-full p-4 rounded-xl border text-right transition-all ${
                      ticketId === t.id
                        ? "border-gold bg-gold/10"
                        : "border-line bg-bg-card hover:border-gold/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-gold font-semibold">{formatILS(t.priceAgorot)}</div>
                      <div className="font-semibold text-ink">{t.label}</div>
                    </div>
                    {t.stock && t.stock < 20 && (
                      <div className="text-xs text-warn mt-1 text-right">
                        נותרו {t.stock} כרטיסים
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-elevated p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:border-gold/40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-display text-2xl text-gold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:border-gold/40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-ink-muted">כמות אנשים</div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={age18}
                onChange={(e) => setAge18(e.target.checked)}
                className="w-5 h-5 rounded border-line bg-bg-soft text-gold focus:ring-gold/40"
              />
              <span className="text-sm text-ink">אני מעל גיל 18</span>
            </label>

            <div className="fixed bottom-0 right-0 left-0 z-30 glass border-t border-line p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-ink-muted text-sm">סה״כ</span>
                <span className="font-display text-2xl text-gold">{formatILS(total)}</span>
              </div>
              <button
                onClick={handlePayClick}
                disabled={!age18 || !ticket}
                className="btn-gold w-full h-12"
              >
                המשך לתשלום ←
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 pt-6 space-y-5"
          >
            <h2 className="font-display text-xl text-gold">אמצעי תשלום</h2>

            <div className="space-y-2">
              <PayMethod
                emoji="💳"
                label="כרטיס אשראי / Apple Pay / Google Pay"
                desc="Visa · Mastercard · Amex · Bit local"
                onClick={() => startPayment("STRIPE_CARD")}
                loading={loading}
                primary
              />
              <PayMethod
                emoji="✨"
                label="Club-it"
                desc={`קבל/י קרדיטים חזרה על הקנייה`}
                onClick={() => startPayment("CLUB_IT")}
                loading={loading}
              />
            </div>

            <div className="card-elevated p-4 space-y-2 text-sm">
              <Row label="כרטיס" value={formatILS(subtotal)} />
              <Row label="עמלת שירות (5%)" value={formatILS(serviceFee)} />
              <Row label="מע״מ (17%)" value={formatILS(vat)} />
              <div className="h-px bg-line my-2" />
              <Row label={<span className="text-ink font-semibold">סה״כ</span>} value={<span className="font-display text-gold text-xl">{formatILS(total)}</span>} />
            </div>

            <p className="text-xs text-ink-muted text-center inline-flex items-center gap-1.5 justify-center w-full">
              <Lock className="w-3 h-3" />
              תשלום מאובטח · 3D Secure · אין שמירת כרטיס בצד הלקוח
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {showSignup && (
        <PrePaySignupPopup
          eventName={event.name}
          credits={Math.round(subtotal * 0.05)}
          onSignup={() => router.push("/auth")}
          onSkip={() => {
            setShowSignup(false);
            setStep(2);
          }}
        />
      )}
    </div>
  );
}

function PayMethod({
  emoji,
  label,
  desc,
  primary,
  loading,
  onClick,
}: {
  emoji: string;
  label: string;
  desc: string;
  primary?: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full p-4 rounded-xl border text-right transition-all ${
        primary
          ? "border-gold bg-gold/10 hover:bg-gold/15"
          : "border-line bg-bg-card hover:border-gold/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="flex-1">
          <div className="font-semibold text-ink">{label}</div>
          <div className="text-xs text-ink-muted">{desc}</div>
        </div>
        {primary && (
          <span className="chip-gold !text-[10px]">הכי משתלם</span>
        )}
      </div>
    </button>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
