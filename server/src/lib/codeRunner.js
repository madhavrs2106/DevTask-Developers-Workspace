import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const TIMEOUT_MS = 8000;
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

const LANG_CONFIG = {
  javascript: { kind: "js", ext: "js", run: { cmd: "node", args: ["runner.js"] } },
  python: { kind: "direct", ext: "py", run: { cmd: getPythonExecutable(), args: ["solution.py"] } },
  c: {
    kind: "compile",
    ext: "c",
    compile: { cmd: "gcc", args: ["solution.c", "-o", "sol_out", "-lm"] },
    run: { cmd: "./sol_out", args: [] },
  },
  cpp: {
    kind: "compile",
    ext: "cpp",
    compile: { cmd: "g++", args: ["solution.cpp", "-o", "sol_out", "-lm"] },
    run: { cmd: "./sol_out", args: [] },
  },
  java: {
    kind: "java",
    ext: "java",
    compile: { cmd: "javac", args: ["Solution.java"] },
    run: { cmd: "java", args: ["Solution"] },
  },
  go: { kind: "direct", ext: "go", run: { cmd: "go", args: ["run", "solution.go"] } },
  ruby: { kind: "direct", ext: "rb", run: { cmd: "ruby", args: ["solution.rb"] } },
};

function runProcess(cmd, args, stdin, timeoutMs, cwd) {
  return new Promise((resolve) => {
    let out = "";
    let err = "";
    let killed = false;
    let settled = false;
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], cwd, env: { ...process.env, NODE_OPTIONS: "" } });

    const finish = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };
    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeoutMs);

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
    child.on("error", (e) => finish({ out, err: e.code === "ENOENT" ? "__NO_RUNTIME__" : err || e.message, code: 1, killed: false }));
    child.on("close", (code) => finish({ out, err, code, killed }));

    if (stdin != null) child.stdin.write(stdin);
    child.stdin.end();
  });
}

function normalize(s) {
  if (s == null) return "";
  return String(s).replace(/\r\n/g, "\n").trim();
}

export async function judgeSubmission({ code, language, testCases }) {
  const lang = (language || "javascript").toLowerCase();
  const config = LANG_CONFIG[lang];
  if (!config) {
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
    const res = await runOne(lang, config, code, tc.input ?? "");
    let passed = false;
    let error = res.error;

    if (res.error === "__TIMEOUT__") {
      anyTimeout = true;
      error = "Time limit exceeded";
    } else if (res.error === "__NO_RUNTIME__") {
      anyRuntimeError = true;
      error = `Runtime for ${lang} is not installed on the server`;
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
      error: res.error === "__TIMEOUT__" ? "Time limit exceeded" : res.error === "__NO_RUNTIME__" ? `Runtime for ${lang} is not installed on the server` : res.error || null,
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

async function runOne(lang, config, code, stdin) {
  let dir;
  try {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "devtask-judge-"));

    // Write source file(s)
    if (config.kind === "js") {
      await fs.writeFile(path.join(dir, "solution.js"), code, "utf8");
      await fs.writeFile(path.join(dir, "runner.js"), JS_WRAPPER, "utf8");
    } else if (config.kind === "java") {
      const fixed = code.replace(/\bclass\s+\w+/, "class Solution");
      await fs.writeFile(path.join(dir, "Solution.java"), fixed, "utf8");
    } else {
      await fs.writeFile(path.join(dir, `solution.${config.ext}`), code, "utf8");
    }

    // Compile step (if any)
    if (config.compile) {
      const c = await runProcess(config.compile.cmd, config.compile.args, "", TIMEOUT_MS, dir);
      if (c.error === "__NO_RUNTIME__") return { actual: "", error: "__NO_RUNTIME__" };
      if (c.code !== 0) {
        return { actual: "", error: `Compilation failed:\n${c.err || ""}`.trim() };
      }
    }

    // Run step
    const r = await runProcess(config.run.cmd, config.run.args, stdin, TIMEOUT_MS, dir);
    if (r.error === "__NO_RUNTIME__") return { actual: "", error: "__NO_RUNTIME__" };
    if (r.killed) return { actual: r.out, error: "__TIMEOUT__" };
    if (r.code !== 0 && !r.out) return { actual: r.out, error: r.err || `Exited with code ${r.code}` };
    return { actual: r.out, error: null };
  } catch (e) {
    return { actual: "", error: e.message };
  } finally {
    if (dir) fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
