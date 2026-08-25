import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Optionally seed demo data on first boot (AUTO_SEED=true).
 * FORCE_SEED=true re-seeds even when users exist (resets demo account only).
 */
async function autoSeed() {
  if (process.env.AUTO_SEED !== "true") return;

  const forceSeed = process.env.FORCE_SEED === "true";
  const userCount = await prisma.user.count();

  if (userCount > 0 && !forceSeed) {
    console.log("[auto-seed] skipped — database already has users");
    return;
  }

  if (forceSeed) {
    console.log("[auto-seed] FORCE_SEED — resetting demo account…");
  } else {
    console.log("[auto-seed] empty database — seeding demo data…");
  }

  await new Promise((resolve, reject) => {
    const seedScript = resolve(__dirname, "../../prisma/seed.mjs");
    const child = spawn(process.execPath, [seedScript], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`seed exited with code ${code}`))
    );
  });
  console.log("[auto-seed] done — login with demo@dev.io / password123");
}

async function main() {
  await autoSeed();

  const server = app.listen(env.port, () => {
    console.log(`🚀 DevTask API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Force-exit if connections hang
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch(async (err) => {
  console.error("Fatal startup error:", err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
