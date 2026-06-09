/**
 * One-shot data migration: SQLite (prisma/dev.db) -> PostgreSQL (current DATABASE_URL).
 *
 * Usage (run on the CRM server, AFTER:
 *   1. schema provider switched to postgresql
 *   2. DATABASE_URL pointing at RDS
 *   3. `npx prisma db push` has created the empty schema in Postgres
 *   4. `npx prisma generate` has produced the postgres client):
 *
 *     SQLITE_PATH=prisma/dev.db node scripts/migrate-sqlite-to-pg.js
 *
 * Reads each table from SQLite via the sqlite3 CLI (-json), coerces types using
 * the Prisma DMMF, topologically orders models by FK dependencies, and bulk-inserts
 * into Postgres. Idempotent-ish: uses skipDuplicates.
 */
const { execFileSync } = require("child_process");
const { PrismaClient, Prisma } = require("@prisma/client");

const SQLITE_PATH = process.env.SQLITE_PATH || "prisma/dev.db";
const prisma = new PrismaClient();

function dumpTable(table) {
  // sqlite3 -json returns [] (empty) or a JSON array of row objects
  const out = execFileSync(
    "sqlite3",
    ["-json", SQLITE_PATH, `SELECT * FROM "${table}";`],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }
  ).trim();
  if (!out) return [];
  try {
    return JSON.parse(out);
  } catch {
    return [];
  }
}

function delegateName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

// Build FK dependency graph from DMMF and topologically sort.
function orderModels(models) {
  const byName = new Map(models.map((m) => [m.name, m]));
  const deps = new Map(); // model -> set of models it references via FK
  for (const m of models) {
    const set = new Set();
    for (const f of m.fields) {
      if (f.kind === "object" && Array.isArray(f.relationFromFields) && f.relationFromFields.length > 0) {
        if (f.type !== m.name && byName.has(f.type)) set.add(f.type); // ignore self-refs for ordering
      }
    }
    deps.set(m.name, set);
  }
  const ordered = [];
  const done = new Set();
  let guard = 0;
  while (ordered.length < models.length && guard < models.length * 4) {
    guard++;
    for (const m of models) {
      if (done.has(m.name)) continue;
      const ready = [...deps.get(m.name)].every((d) => done.has(d));
      if (ready) {
        ordered.push(m);
        done.add(m.name);
      }
    }
  }
  // append any leftovers (cycles / self-refs) in original order
  for (const m of models) if (!done.has(m.name)) ordered.push(m);
  return ordered;
}

function coerceRow(model, row) {
  const out = {};
  for (const f of model.fields) {
    if (f.kind === "object") continue; // skip relation fields
    if (!(f.name in row)) continue;
    let v = row[f.name];
    if (v === null || v === undefined) {
      out[f.name] = null;
      continue;
    }
    switch (f.type) {
      case "Boolean":
        out[f.name] = v === 1 || v === true || v === "1" || v === "true";
        break;
      case "DateTime": {
        let d = null;
        if (typeof v === "number") {
          d = new Date(v); // epoch ms
        } else if (typeof v === "string") {
          if (/^\d+$/.test(v)) {
            d = new Date(Number(v)); // epoch ms as string
          } else {
            // sqlite text datetime "YYYY-MM-DD HH:MM:SS" (UTC, no tz) -> ISO
            const iso = v.includes("T") ? v : v.replace(" ", "T");
            const withZ = /[zZ]|[+\-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z";
            d = new Date(withZ);
          }
        }
        if (!d || isNaN(d.getTime())) d = f.isRequired ? new Date() : null;
        out[f.name] = d;
        break;
      }
      case "Int":
      case "BigInt":
        out[f.name] = typeof v === "number" ? v : parseInt(v, 10);
        break;
      case "Float":
      case "Decimal":
        out[f.name] = typeof v === "number" ? v : parseFloat(v);
        break;
      default:
        out[f.name] = v; // String / Json (stored as string in this schema)
    }
  }
  return out;
}

async function main() {
  const models = orderModels(Prisma.dmmf.datamodel.models);
  console.log("Migration order:", models.map((m) => m.name).join(" -> "));
  let totalRows = 0;
  for (const model of models) {
    const rows = dumpTable(model.dbName || model.name);
    if (rows.length === 0) {
      console.log(`  ${model.name}: 0 rows (skip)`);
      continue;
    }
    const data = rows.map((r) => coerceRow(model, r));
    const delegate = prisma[delegateName(model.name)];
    if (!delegate || typeof delegate.createMany !== "function") {
      console.log(`  ${model.name}: no delegate, skip`);
      continue;
    }
    const res = await delegate.createMany({ data, skipDuplicates: true });
    totalRows += res.count;
    console.log(`  ${model.name}: inserted ${res.count}/${rows.length}`);
  }
  console.log(`Done. Total rows inserted: ${totalRows}`);
}

main()
  .catch((e) => {
    console.error("MIGRATION FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
