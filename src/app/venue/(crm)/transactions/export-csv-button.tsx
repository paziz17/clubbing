"use client";

import { Download } from "lucide-react";

export interface CsvRow {
  date: string;
  customer: string;
  event: string;
  method: string;
  amount: string;
  credits: string;
  status: string;
}

const HEADERS = [
  "תאריך",
  "לקוח",
  "אירוע",
  "אמצעי תשלום",
  "סכום (₪)",
  "קרדיטים",
  "סטטוס",
];

function escapeCell(value: string): string {
  const v = value ?? "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function ExportCsvButton({ rows }: { rows: CsvRow[] }) {
  function handleExport() {
    const lines = [
      HEADERS.join(","),
      ...rows.map((r) =>
        [r.date, r.customer, r.event, r.method, r.amount, r.credits, r.status]
          .map(escapeCell)
          .join(",")
      ),
    ];
    // BOM so Excel opens UTF-8 (Hebrew) correctly
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clubbing-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="btn-ghost h-9 px-4 text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      ייצוא CSV
    </button>
  );
}
