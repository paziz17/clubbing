/**
 * Grow (Meshulam) — Israeli payment gateway integration.
 *
 * Light API, "Regular Payment" (redirect) flow:
 *   1. createPaymentProcess  -> returns a hosted payment-page `url` + processId/processToken
 *   2. user pays on Grow's page (card / Bit / Apple Pay / Google Pay)
 *   3. Grow notifies our server (notifyUrl) AND redirects the user to successUrl
 *   4. we MUST call approveTransaction to finalize the charge (mandatory step)
 *
 * Everything is gated behind `isGrowConfigured()`: with no GROW_* env vars set,
 * the checkout flow falls back to demo mode and nothing changes.
 *
 * Docs: https://grow-il.readme.io/  ·  https://developers.grow.business/reference/the-process
 */

const PAGE_CODE = process.env.GROW_PAGE_CODE?.trim();
const USER_ID = process.env.GROW_USER_ID?.trim();

// "production" hits the live gateway; anything else uses the sandbox.
const GROW_ENV = (process.env.GROW_ENV ?? "sandbox").trim().toLowerCase();
const IS_PROD = GROW_ENV === "production" || GROW_ENV === "prod" || GROW_ENV === "live";

const BASE = IS_PROD
  ? "https://secure.meshulam.co.il/api/light/server/1.0/"
  : "https://sandbox.meshulam.co.il/api/light/server/1.0/";

export const isGrowConfigured = () => Boolean(PAGE_CODE && USER_ID);

export interface GrowResponse<T = any> {
  status: number | string; // "1"/1 = success, "0"/0 = error (Grow returns a string)
  err?: unknown;
  data?: T;
}

/** Grow returns `status` as the string "1" on success (sometimes a number). */
const isStatusOk = (json: GrowResponse) => String(json?.status) === "1";

async function growPost<T = any>(
  action: string,
  fields: Record<string, string | number | undefined | null>
): Promise<GrowResponse<T>> {
  if (!isGrowConfigured()) throw new Error("Grow is not configured");

  const body = new URLSearchParams();
  body.set("pageCode", PAGE_CODE!);
  body.set("userId", USER_ID!);
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== "") {
      body.set(key, String(value));
    }
  }

  const res = await fetch(`${BASE}${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as GrowResponse<T> | null;
  if (!json) throw new Error(`Grow ${action}: invalid response (HTTP ${res.status})`);
  return json;
}

/** A full Israeli mobile number is mandatory for Grow; fall back to a placeholder. */
function normalizePhone(phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return digits;
  if (/^9725\d{8}$/.test(digits)) return "0" + digits.slice(3);
  return "0500000000";
}

/** Grow requires at least two names. */
function normalizeFullName(name?: string | null): string {
  const clean = (name ?? "").trim().replace(/\s+/g, " ");
  return clean.split(" ").length >= 2 ? clean : "לקוח קלאבינג";
}

export interface CreateGrowPaymentParams {
  amountAgorot: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  reservationId: string;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentNum?: number; // installments (1 = single charge)
}

export interface GrowProcess {
  url: string;
  processId: string;
  processToken: string;
}

/** Open a hosted Grow payment process and return the page URL to redirect to. */
export async function createGrowPayment(params: CreateGrowPaymentParams): Promise<GrowProcess> {
  const sum = (params.amountAgorot / 100).toFixed(2);

  const json = await growPost<{ url?: string; processId: number | string; processToken: string }>(
    "createPaymentProcess",
    {
      sum,
      description: params.description.slice(0, 250),
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      notifyUrl: params.notifyUrl,
      chargeType: 1, // 1 = standard charge
      paymentNum: params.paymentNum ?? 1,
      "pageField[fullName]": normalizeFullName(params.fullName),
      "pageField[phone]": normalizePhone(params.phone),
      "pageField[email]": params.email ?? "",
      // cField1 round-trips our reservation id back on the server callback.
      cField1: params.reservationId,
    }
  );

  if (isStatusOk(json) && json.data?.url) {
    return {
      url: json.data.url,
      processId: String(json.data.processId),
      processToken: json.data.processToken,
    };
  }
  throw new Error(`Grow createPaymentProcess failed: ${JSON.stringify(json.err ?? json)}`);
}

export interface GrowApproval {
  /** True only when the transaction is actually paid (statusCode "2"). */
  ok: boolean;
  transactionId: string | null;
  /** Asmachta (receipt/confirmation number) reported by Grow. */
  asmachta: string | null;
  /** Amount Grow reports as charged, in agorot (null when not reported). */
  amountAgorot: number | null;
  data: any;
}

/**
 * Mandatory finalization step: approve a previously-initiated transaction.
 *
 * Grow's approveTransaction response (confirmed contract):
 *   { status: "1", data: { statusCode: "2" (= "שולם"), transactionId, asmachta,
 *                          sum, cardSuffix, customFields: { cField1 }, ... } }
 * `status` only means the API call succeeded; payment is confirmed by
 * `data.statusCode === "2"`.
 */
export async function approveGrowTransaction(processId: string, processToken: string): Promise<GrowApproval> {
  const json = await growPost<any>("approveTransaction", { processId, processToken });
  const data = json.data ?? {};
  // Some endpoints nest the transaction inside a `transactions` array.
  const txn = Array.isArray(data.transactions) ? data.transactions[0] ?? {} : data;

  const paid = isStatusOk(json) && String(txn.statusCode ?? data.statusCode) === "2";
  const transactionId = txn.transactionId ?? data.transactionId ?? null;
  const asmachta = txn.asmachta ?? data.asmachta ?? null;
  const rawSum = txn.sum ?? txn.paymentSum ?? data.sum ?? null;
  const amountAgorot = rawSum != null ? Math.round(Number(rawSum) * 100) : null;

  return {
    ok: paid,
    transactionId: transactionId != null ? String(transactionId) : null,
    asmachta: asmachta != null ? String(asmachta) : null,
    amountAgorot: Number.isFinite(amountAgorot as number) ? (amountAgorot as number) : null,
    data: json.data ?? json,
  };
}

/** Best-effort refund of a Grow transaction (internal records are reversed regardless). */
export async function refundGrowTransaction(
  transactionId: string,
  amountAgorot?: number
): Promise<{ ok: boolean; data: any }> {
  try {
    const json = await growPost<any>("refundTransaction", {
      transactionId,
      sum: amountAgorot != null ? (amountAgorot / 100).toFixed(2) : undefined,
    });
    return { ok: isStatusOk(json), data: json.data ?? json };
  } catch (err) {
    console.error("Grow refund failed:", err);
    return { ok: false, data: null };
  }
}
