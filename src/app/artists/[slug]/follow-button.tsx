"use client";

import { useEffect, useState } from "react";

export function FollowButton({ artistId }: { artistId: string }) {
  const [following, setFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/artists/follow")
      .then((r) => r.json())
      .then((d) => setFollowing(d.following?.some((a: any) => a.id === artistId)));
  }, [artistId]);

  async function toggle() {
    const method = following ? "DELETE" : "POST";
    await fetch("/api/artists/follow", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ artistId }),
    });
    setFollowing((f) => !f);
  }

  if (following === null) return <button className="btn-ghost w-full">...</button>;
  return (
    <button onClick={toggle} className={following ? "btn-ghost w-full" : "btn-gold w-full"}>
      {following ? "✓ עוקב · בטל מעקב" : "+ עקוב"}
    </button>
  );
}
