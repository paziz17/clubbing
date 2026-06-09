"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function EventActions({ eventId, status }: { eventId: string; status: string }) {
  const router = useRouter();

  async function patch(payload: any) {
    await fetch(`/api/venue/events/${eventId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm("למחוק את האירוע?")) return;
    await fetch(`/api/venue/events/${eventId}`, { method: "DELETE" });
    router.push("/venue/events");
  }

  return (
    <div className="flex gap-2">
      {status !== "PUBLISHED" && (
        <Button size="sm" onClick={() => patch({ status: "PUBLISHED" })}>
          פרסם
        </Button>
      )}
      {status === "PUBLISHED" && (
        <Button size="sm" variant="ghost" onClick={() => patch({ status: "DRAFT" })}>
          החזר לטיוטה
        </Button>
      )}
      {status !== "ENDED" && (
        <Button size="sm" variant="ghost" onClick={() => patch({ status: "ENDED" })}>
          סיים
        </Button>
      )}
      <Button size="sm" variant="danger" onClick={remove}>
        🗑 מחק
      </Button>
    </div>
  );
}
