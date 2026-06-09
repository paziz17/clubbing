/**
 * One-command local bootstrap.
 *
 *   npm run setup
 *
 * 1. Creates .env if missing (with safe local defaults).
 * 2. Generates Prisma client.
 * 3. Creates/migrates SQLite DB at prisma/dev.db.
 * 4. Seeds demo venues + events + menu.
 *
 * Idempotent — safe to re-run.
 */

import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");
const ENV_EXAMPLE = resolve(ROOT, ".env.example");

function log(msg: string) {
  console.log(`\x1b[33m▸\x1b[0m ${msg}`);
}
function ok(msg: string) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

function run(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function setupEnv() {
  if (existsSync(ENV_PATH)) {
    ok(".env already exists — skipping");
    return;
  }
  log("Creating .env with local defaults...");
  let template = readFileSync(ENV_EXAMPLE, "utf8");
  template = template.replace(
    'NEXTAUTH_SECRET="dev-secret-please-change"',
    `NEXTAUTH_SECRET="${randomBytes(32).toString("base64")}"`
  );
  template = template.replace(
    'VENUE_SESSION_SECRET="dev-venue-secret-please-change"',
    `VENUE_SESSION_SECRET="${randomBytes(32).toString("base64")}"`
  );
  writeFileSync(ENV_PATH, template);
  ok(".env created with fresh secrets");
}

function main() {
  console.log("\n\x1b[35m🌙 CLUBBING · local setup\x1b[0m\n");

  setupEnv();

  log("Generating Prisma client...");
  run("npx", ["prisma", "generate"]);

  log("Creating SQLite database...");
  run("npx", ["prisma", "db", "push", "--accept-data-loss"]);

  log("Seeding demo data...");
  run("npx", ["tsx", "prisma/seed.ts"]);

  console.log("\n\x1b[32m✓ Setup complete!\x1b[0m\n");
  console.log("Next steps:\n");
  console.log("  \x1b[33mnpm run dev\x1b[0m            # start the app at http://localhost:3000");
  console.log("  \x1b[33mnpm run db:studio\x1b[0m      # browse the database (Prisma Studio)");
  console.log("  \x1b[33mnpm run db:reset\x1b[0m       # wipe and re-seed\n");
  console.log("Demo credentials:");
  console.log("  Venue CRM:   /venue/login  →  goldroom / demo1234\n");
}

main();
