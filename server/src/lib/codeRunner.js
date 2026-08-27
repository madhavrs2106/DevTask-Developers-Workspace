import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const TIMEOUT_MS = 5000;
const MAX_OUTPUT = 100000;

function getPythonExecutable() {
  return process.platform === "win32" ? "python" : "python3";
}

// Node wrapper: reads stdin asynchronously (reliable), then runs the user's
// solution with readFileSync(0) patched to return the full collected input.
// Avoids the non-blocking race of fs.readFileSync(0) on a pipe.
const JS_WRAPPER = `
const fs = require("fs");
const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  const input = Buffer.concat(chunks).toString("utf8");
  const orig = fs.readFileSync.bind(fs);
  fs.readFileSync = (fd, enc, opts) => {
    if (fd === 0 || fd === "0") return enc ? input : Buffer.from(input);
    return orig(fd, enc, opts);
  };
  require("./solution.js");
});
process.stdin.on("error", () => {});
`;

function runOne(lang, userCode, stdin) {
  return new Promise(async (resolve) => {
    let dir;
    try {
      dir = await fs.mkdtemp(path.join(os.tmpdir(), "devtask-judge-"));
      await fs.writeFile(path.join(dir, "solution.js"), userCode, "utf8");

      let execFile, exeArgs;
      if (lang === "python") {
        execFile = "solution.py";
        exeArgs = [getPythonExecutable()];
        await fs.writeFile(path.join(dir, "solution.py"), userCode, "utf8");
      } else {
        await fs.writeFile(path.join(dir, "runner.js"), JS_WRAPPER, "utf8");
        execFile = "runner.js";
        exeArgs = ["node", "--max-old-space-size=128"];
      }
      const file = path.join(dir, execFile);

      let out = "";
      let err = "";
      let killed = false;
      let settled = false;

      const child = spawn(exeArgs[0], [...exeArgs.slice(1), file], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, NODE_OPTIONS: "" },
      });

      const cleanup = () => {
        if (dir) fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      };
      const finish = (r) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(r);
      };

      const timer = setTimeout(() => {
        killed = true;
        child.kill("SIGKILL");
      }, TIMEOUT_MS);

      child.stdout.on("data", (d) => {
        out += d.toString();
        if (out.length > MAX_OUTPUT) {
          out = out.slice(0, MAX_OUTPUT);
          child.kill("SIGKILL");
        }
      });
      child.stderr.on("data", (d) => {
        err += d.toString();
        if (err.length > MAX_OUTPUT) err = err.slice(0, MAX_OUTPUT);
      });

      child.on("error", (e) => finish({ actual: "", error: e.message }));
      child.on("close", (code) => {
        if (killed) finish({ actual: out, error: "__TIMEOUT__" });
        else if (code !== 0 && !out) finish({ actual: out, error: err || `Exited with code ${code}` });
        else finish({ actual: out, error: null });
      });

      if (stdin != null) child.stdin.write(stdin);
      child.stdin.end();
    } catch (e) {
      if (dir) fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      resolve({ actual: "", error: e.message });
    }
  });
}

function normalize(s) {
  if (s == null) return "";
  return String(s).replace(/\r\n/g, "\n").trim();
}

export async function judgeSubmission({ code, language, testCases }) {
  const lang = (language || "javascript").toLowerCase();
  const isPy = lang === "python" || lang === "py";
  const isJs = lang === "javascript" || lang === "js" || lang === "node";
  const langKey = isPy ? "python" : isJs ? "javascript" : null;

  if (!langKey) {
    return {
      passed: 0,
      total: testCases.length,
      status: "RUNTIME_ERROR",
      results: testCases.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
        actual: "",
        passed: false,
        error: `Unsupported language: ${language}`,
      })),
    };
  }

  const results = [];
  let allPassed = true;
  let anyTimeout = false;
  let anyRuntimeError = false;
  let anyWrong = false;

  for (const tc of testCases) {
    const res = await runOne(langKey, code, tc.input ?? "");
    let passed = false;
    let error = res.error;
    if (res.error === "__TIMEOUT__") {
      anyTimeout = true;
      error = "Time limit exceeded";
    } else if (res.error) {
      anyRuntimeError = true;
    } else {
      passed = normalize(res.actual) === normalize(tc.expected);
      if (!passed) anyWrong = true;
    }
    if (!passed) allPassed = false;
    results.push({
      input: tc.input,
      expected: tc.expected,
      actual: res.actual,
      passed,
      error: res.error === "__TIMEOUT__" ? "Time limit exceeded" : res.error || null,
    });
  }

  let status = "ACCEPTED";
  if (!allPassed) {
    if (anyTimeout) status = "TIME_LIMIT";
    else if (anyRuntimeError) status = "RUNTIME_ERROR";
    else status = "WRONG";
  }

  return {
    passed: results.filter((r) => r.passed).length,
    total: testCases.length,
    status,
    results,
  };
}
