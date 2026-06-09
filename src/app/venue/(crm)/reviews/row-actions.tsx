"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function ReviewRowActions({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter();
  async function update(newStatus: string) {
    await fetch(`/api/venue/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ crmStatus: newStatus }),
    });
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2">
      <Badge variant={status === "UNREAD" ? "warn" : status === "HANDLED" ? "success" : "default"}>
        {status === "UNREAD" ? "לא נקרא" : status === "HANDLED" ? "טופל" : "נקרא"}
      </Badge>
      {status === "UNREAD" && (
        <button
          onClick={() => update("READ")}
          className="text-xs text-gold hover:underline"
        >
          סמן כנקרא
        </button>
      )}
      {status !== "HANDLED" && (
        <button
          onClick={() => update("HANDLED")}
          className="text-xs text-success hover:underline"
        >
          סמן כטופל
        </button>
      )}
    </div>
  );
}
