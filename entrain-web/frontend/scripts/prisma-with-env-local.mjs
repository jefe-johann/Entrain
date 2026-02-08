import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const shellEnvKeys = new Set(Object.keys(process.env));
const env = { ...process.env };

function loadEnvFile(filename) {
  const filepath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filepath)) {
    return;
  }

  const fileContents = fs.readFileSync(filepath, "utf8");
  const lines = fileContents.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    if (shellEnvKeys.has(key)) {
      continue;
    }

    let value = match[2];
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to frontend/.env.local or your shell environment.");
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("Usage: node scripts/prisma-with-env-local.mjs <prisma-args>");
  process.exit(1);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npxCommand, ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env,
});

child.on("error", (error) => {
  console.error("Failed to execute Prisma CLI:", error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
