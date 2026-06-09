"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ClubItCard } from "@/components/club-it-card";
import { Loader2, Check } from "lucide-react";

export default function ClubItJoinPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState((session?.user?.name as string) || "");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  async function handleIssue() {
    if (!name || !agreed) return;
    setIssuing(true);
    setStage(1);
    await new Promise((r) => setTimeout(r, 700));
    setStage(2);

    const res = await fetch("/api/club-it/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setStage(3);
    await new Promise((r) => setTimeout(r, 700));

    if (data?.cardId) {
      router.push(`/club-it/card?welcome=1`);
    } else {
      setIssuing(false);
      alert(data?.error ?? "ההנפקה נכשלה");
    }
  }

  if (issuing) return <IssuingScreen stage={stage} />;

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-10 pb-6 text-center">
        <h1 className="font-display text-2xl text-gold mb-2">הנפקת כרטיס</h1>
        <p className="text-sm text-ink-muted">השם יופיע על הכרטיס</p>
      </div>

      <div className="flex justify-center mb-6">
        <ClubItCard name={name || "YOUR NAME"} preview />
      </div>

      <div className="px-5 space-y-4">
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">שם על הכרטיס</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 26))}
            className="input"
            placeholder="לדוגמה: OMER COHEN"
            maxLength={26}
          />
          <div className="text-[10px] text-ink-dim mt-1">עד 26 תווים</div>
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">טלפון (לאימות SMS)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="050-0000000"
            type="tel"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-line bg-bg-soft text-gold"
          />
          <span className="text-sm text-ink">
            קראתי ואני מסכים/ה ל<a className="underline">תקנון</a> ול<a className="underline">פרטיות</a>
          </span>
        </label>
        <button
          onClick={handleIssue}
          disabled={!name || !agreed}
          className="btn-gold w-full h-12 mt-2"
        >
          הנפק/י את הכרטיס שלי ←
        </button>
      </div>
    </div>
  );
}

function IssuingScreen({ stage }: { stage: number }) {
  const stages = [
    { id: 1, label: "פרטים אומתו" },
    { id: 2, label: "דרגה הוקצתה — REGULAR" },
    { id: 3, label: "הפקת מספר כרטיס..." },
  ];
  return (
    <div className="mobile-screen flex flex-col items-center justify-center relative">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute w-64 h-64 rounded-full bg-gold/30 blur-3xl"
      />
      <div className="relative z-10 text-center px-8">
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <ClubItCard size="md" />
        </motion.div>
        <div className="mt-8 space-y-2">
          {stages.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= s.id ? 1 : 0.3 }}
              className="flex items-center gap-2 justify-center text-sm"
            >
              {stage > s.id ? (
                <Check className="w-4 h-4 text-success" />
              ) : stage === s.id ? (
                <Loader2 className="w-4 h-4 text-gold animate-spin" />
              ) : (
                <span className="w-4 h-4" />
              )}
              <span className={stage >= s.id ? "text-ink" : "text-ink-dim"}>{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
