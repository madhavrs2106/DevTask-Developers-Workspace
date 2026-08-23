import { spawn } from "node:child_process";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

/**
 * Optionally seed demo data on first boot (AUTO_SEED=true).
 * Only runs when the users table is empty, so it never overwrites real data.
 */
async function autoSeed() {
  if (process.env.AUTO_SEED !== "true") return;

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("[auto-seed] skipped — database already has users");
    return;
  }

  console.log("[auto-seed] empty database — seeding demo data…");
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["../prisma/seed.mjs"], {
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
