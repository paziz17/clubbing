"use client";

import { motion } from "framer-motion";
import { formatCredits } from "@/lib/utils";

interface Props {
  eventName: string;
  credits: number;
  onSignup: () => void;
  onSkip: () => void;
}

export function PrePaySignupPopup({ credits, onSignup, onSkip }: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center max-w-md mx-auto">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-bg-card border border-gold/30 rounded-t-3xl sm:rounded-2xl p-6 shadow-gold-strong"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="font-display text-2xl text-gold mb-2">הצטרף/י למועדון</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            צבירה אוטומטית של {formatCredits(credits)} קרדיטים על ההזמנה הזו
            <br />
            מבצעים ב-WhatsApp · זיהוי מהיר בכניסה
          </p>
        </div>

        <ul className="space-y-2 mb-6 text-sm">
          <Bullet>✓ צבירת קרדיטים אוטומטית</Bullet>
          <Bullet>✓ מבצעי WhatsApp ייעודיים</Bullet>
          <Bullet>✓ זיהוי מהיר בכניסה</Bullet>
        </ul>

        <button onClick={onSignup} className="btn-gold w-full h-12 mb-3">
          הצטרף/י עם Google / Facebook / Instagram ←
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-ink-muted hover:text-ink"
        >
          המשך/י כאורח
        </button>
      </motion.div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <li className="text-ink">{children}</li>;
}
