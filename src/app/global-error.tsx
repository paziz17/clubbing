"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html>
      <body>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:"16px",fontFamily:"sans-serif"}}>
          <h2 style={{color:"#F87171"}}>שגיאה בלתי צפויה</h2>
          <p style={{color:"#9A9080"}}>אנחנו מטפלים בזה</p>
          <button onClick={reset} style={{padding:"8px 20px",background:"#D4AF37",border:"none",borderRadius:"6px",cursor:"pointer"}}>נסה שוב</button>
        </div>
      </body>
    </html>
  );
}
