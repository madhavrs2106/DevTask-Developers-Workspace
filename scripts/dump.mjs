import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const models = Object.keys(prisma).filter(
  (k) => !k.startsWith("_") && typeof prisma[k]?.findMany === "function"
);

const out = {};
for (const m of models) {
  try {
    out[m] = await prisma[m].findMany();
  } catch (e) {
    out[m] = { error: String(e) };
  }
}

const dir = dirname(fileURLToPath(import.meta.url));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = join(dir, `devtask-backup-${stamp}.json`);
mkdirSync(dir, { recursive: true });
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`Backed up ${models.length} models -> ${file}`);
await prisma.$disconnect();
