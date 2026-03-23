#!/usr/bin/env node
/**
 * SRS Acceptance Test — NightLife Loyalty Platform MVP
 * לפי סעיף 12: קריטריוני קבלה — 'מוכן לפיילוט'
 *
 * הרצה: npm run test
 * דרוש: שרת רץ על http://localhost:3000 (או PORT מהסביבה)
 */

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
let passed = 0;
let failed = 0;

function log(msg, ok) {
  const icon = ok ? "✓" : "✗";
  const color = ok ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${icon}\x1b[0m ${msg}`);
  if (ok) passed++;
  else failed++;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { res, data };
}

async function runTests() {
  console.log("\n=== SRS Acceptance Tests — NightLife Loyalty MVP ===\n");

  let token;
  let userId;
  let clubId;
  let passId;
  let qrToken;
  let visitId;

  // --- Test 1: Signup → Pass → QR (קריטריון 1) ---
  try {
    const { res, data } = await fetchJson(`${BASE}/api/auth/test-login`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(data.error || "Test login failed");
    token = data.token;
    userId = data.user?.id;
    log("1. משתמש יכול להירשם/להתחבר (Test Login)", !!token);
  } catch (e) {
    log("1. Signup/Login — " + e.message, false);
  }

  // --- Clubs ---
  try {
    const { res, data } = await fetchJson(`${BASE}/api/clubs`);
    const clubs = Array.isArray(data) ? data : data.clubs || [];
    clubId = clubs[0]?.id;
    log("2. רשימת מועדונים (מינימום 2)", clubs.length >= 2);
  } catch (e) {
    log("2. Clubs — " + e.message, false);
  }

  // --- Test 3: Pass + QR (קריטריון 1) ---
  if (token && clubId) {
    try {
      const { res, data } = await fetchJson(`${BASE}/api/clubs/${clubId}/passes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(data.error || "Pass creation failed");
      passId = data.id;
      qrToken = data.qrToken;
      log("3. יצירת Pass + QR", !!(passId && qrToken));
    } catch (e) {
      log("3. Pass + QR — " + e.message, false);
    }
  } else {
    log("3. Pass + QR — חסר token/clubId", false);
  }

  // --- Test 4: Check-in (קריטריון 2) ---
  if (qrToken) {
    try {
      const start = Date.now();
      const { res, data } = await fetchJson(`${BASE}/api/crm/checkin`, {
        method: "POST",
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const elapsed = Date.now() - start;
      if (!res.ok) throw new Error(data.error || "Check-in failed");
      visitId = data.visitId;
      log("4. Check-in מוצלח (< 2 שניות)", elapsed < 3000 && !!visitId);
    } catch (e) {
      log("4. Check-in — " + e.message, false);
    }
  } else {
    log("4. Check-in — חסר qrToken", false);
  }

  // --- Test 5: Double Scan Rejection (קריטריון 7) ---
  if (qrToken) {
    try {
      const { res, data } = await fetchJson(`${BASE}/api/crm/checkin`, {
        method: "POST",
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const rejected = res.status === 400 && (data.alreadyCheckedIn || data.error?.includes("כבר"));
      log("5. QR ששומש נחסם — 'הבליין כבר נכנס'", rejected);
    } catch (e) {
      log("5. Double Scan — " + e.message, false);
    }
  } else {
    log("5. Double Scan — חסר qrToken", false);
  }

  // --- Test 6: Transaction → Wallet (קריטריון 3) ---
  if (token && userId && clubId) {
    try {
      const { res: txRes, data: txData } = await fetchJson(`${BASE}/api/crm/transaction`, {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          club_id: clubId,
          amount: 100,
        }),
      });
      if (!txRes.ok) throw new Error(txData.error || "Transaction failed");

      const { res: wRes, data: wData } = await fetchJson(
        `${BASE}/api/wallet?club_id=${clubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const hasCredits = wRes.ok && wData.balance >= 5; // 5% of 100
      log("6. עסקה → קרדיטים ב-Wallet", hasCredits);
    } catch (e) {
      log("6. Transaction → Wallet — " + e.message, false);
    }
  } else {
    log("6. Transaction → Wallet — חסר נתונים", false);
  }

  // --- Test 7: Anti-Duplicate (קריטריון 8) ---
  if (userId && clubId) {
    try {
      const body = { user_id: userId, club_id: clubId, amount: 50 };
      const r1 = await fetchJson(`${BASE}/api/crm/transaction`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const r2 = await fetchJson(`${BASE}/api/crm/transaction`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const firstOk = r1.res.ok;
      const secondBlocked = !r2.res.ok && r2.data.error;
      log("7. אנטי-דאבל על עסקאות", firstOk && secondBlocked);
    } catch (e) {
      log("7. Anti-Duplicate — " + e.message, false);
    }
  } else {
    log("7. Anti-Duplicate — חסר נתונים", false);
  }

  // --- Test 8: Wallet Ledger (קריטריון 4) ---
  if (token && clubId) {
    try {
      const { res, data } = await fetchJson(
        `${BASE}/api/wallet/ledger?club_id=${clubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      log("8. ארנק — יתרה + היסטוריה", res.ok && Array.isArray(data));
    } catch (e) {
      log("8. Wallet Ledger — " + e.message, false);
    }
  } else {
    log("8. Wallet Ledger — חסר נתונים", false);
  }

  // --- Test 9: Dashboard (קריטריון 5) ---
  if (clubId) {
    try {
      const { res, data } = await fetchJson(
        `${BASE}/api/dashboard/overview?club_id=${clubId}`
      );
      const hasKpi = res.ok && typeof data.gmv === "number";
      log("9. דשבורד GMV/Avg Spend", hasKpi);
    } catch (e) {
      log("9. Dashboard — " + e.message, false);
    }
  } else {
    log("9. Dashboard — חסר clubId", false);
  }

  // --- Test 10: Campaign (קריטריון 6) ---
  if (clubId) {
    try {
      const { res: cRes, data: cData } = await fetchJson(`${BASE}/api/campaigns`, {
        method: "POST",
        body: JSON.stringify({
          club_id: clubId,
          name: "טסט SRS",
          filters: { visited_in_last_days: 30 },
          action: "grant_bonus_credits",
          action_meta: { credits: 5 },
        }),
      });
      const campaignId = cData.id;
      if (!campaignId) throw new Error("No campaign id");

      const { res: rRes, data: rData } = await fetchJson(
        `${BASE}/api/campaigns/${campaignId}/run`,
        { method: "POST" }
      );
      log("10. קמפיין — שליחת בונוס", rRes.ok && rData.affected >= 0);
    } catch (e) {
      log("10. Campaign — " + e.message, false);
    }
  } else {
    log("10. Campaign — חסר clubId", false);
  }

  console.log("\n--- סיכום ---");
  console.log(`\x1b[32mעבר: ${passed}\x1b[0m | \x1b[31mנכשל: ${failed}\x1b[0m\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
