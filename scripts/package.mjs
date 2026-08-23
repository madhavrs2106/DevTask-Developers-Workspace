#!/usr/bin/env node
/**
 * Packages the DevTask repository into DevTask.zip.
 * Excludes node_modules, build output, .git, .env secrets and the archive itself.
 *
 * Usage: npm run package   (or: node scripts/package.mjs)
 */
import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outPath = resolve(root, "DevTask.zip");

const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.env",
  "**/.env.local",
  "**/npm-debug.log*",
  "DevTask.zip",
  "**/*.db",
  "**/*.db-journal",
  "**/.DS_Store",
  "**/Thumbs.db",
];

async function main() {
  const output = createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const done = new Promise((ok, fail) => {
    output.on("close", ok);
    archive.on("warning", (err) => {
      if (err.code !== "ENOENT") fail(err);
    });
    archive.on("error", fail);
  });

  archive.pipe(output);
  archive.glob("**/*", { cwd: root, ignore: IGNORE, dot: false });
  await archive.finalize();
  await done;

  const mb = (archive.pointer() / (1024 * 1024)).toFixed(2);
  console.log(`✔ Packaged repository into ${outPath} (${mb} MB)`);
}

main().catch((err) => {
  console.error("✖ Packaging failed:", err.message);
  process.exitCode = 1;
});
