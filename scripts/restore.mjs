import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir)
  .filter((f) => f.startsWith("devtask-backup-") && f.endsWith(".json"))
  .sort();
if (!files.length) {
  console.error("No backup file (devtask-backup-*.json) found in scripts/");
  process.exit(1);
}
const file = join(dir, files[files.length - 1]);
const data = JSON.parse(readFileSync(file, "utf8"));
console.log(`Using backup: ${file}`);

const prisma = new PrismaClient();

async function main() {
  // Clear all tables (including the freshly-seeded demo) so we restore the full backup cleanly.
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
  );
  const names = tables.map((t) => `"${t.table_name}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE;`);
  console.log(`Truncated ${tables.length} tables`);

  let total = 0;
  for (const model of Object.keys(data)) {
    const rows = data[model];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    try {
      await prisma[model].createMany({ data: rows, skipDuplicates: true });
      console.log(`  restored ${model}: ${rows.length}`);
      total += rows.length;
    } catch (e) {
      console.error(`  FAILED ${model}: ${e.message}`);
    }
  }
  console.log(`Done. Restored ${total} rows total.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
