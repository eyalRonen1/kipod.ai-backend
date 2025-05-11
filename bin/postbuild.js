/* bin/postbuild.js – create a < 100 MB bundle for Amplify Hosting Compute */
const fs   = require("fs-extra");
const cp   = require("child_process");
const path = require("path");

const OUT_ROOT = ".amplify-hosting";
const OUT_DIR  = path.join(OUT_ROOT, "compute", "default");

function cleanDir(p) { try { fs.removeSync(p); } catch (_) {} }

// ──────────────────────────────────────────────────────────────────────────
// 1. fresh bundle folder
cleanDir(OUT_ROOT);
fs.ensureDirSync(OUT_DIR);

// ──────────────────────────────────────────────────────────────────────────
// 2. locate Medusa server entry-point
const SERVER_ROOT = ".medusa/server";
const candidates  = ["index.js", "server.js", "index.mjs", "main.js", "app.js"];
let entry = candidates.find(f => fs.existsSync(path.join(SERVER_ROOT, f)));

if (!entry) {
  console.error("❌  No server entry-point found in .medusa/server");
  process.exit(1);
}

// copy entry file
fs.copySync(path.join(SERVER_ROOT, entry), path.join(OUT_DIR, "index.js"));

// copy compiled code dir if present (dist or build)
["dist", "build"].forEach(dir => {
  if (fs.existsSync(path.join(SERVER_ROOT, dir))) {
    fs.copySync(path.join(SERVER_ROOT, dir), path.join(OUT_DIR, dir), {
      recursive: true,
    });
  }
});

// copy optional instrumentation file (tiny)
["instrumentation.js"].forEach(f => {
  if (fs.existsSync(path.join(SERVER_ROOT, f))) {
    fs.copySync(path.join(SERVER_ROOT, f), path.join(OUT_DIR, f));
  }
});

// ──────────────────────────────────────────────────────────────────────────
// 3. install production deps only
fs.copySync("package.json",  path.join(OUT_DIR, "package.json"));
if (fs.existsSync("package-lock.json"))
  fs.copySync("package-lock.json", path.join(OUT_DIR, "package-lock.json"));
if (fs.existsSync("yarn.lock"))
  fs.copySync("yarn.lock",         path.join(OUT_DIR, "yarn.lock"));

if (fs.existsSync("yarn.lock")) {
  cp.execSync("yarn install --production --frozen-lockfile", {
    cwd: OUT_DIR, stdio: "inherit",
  });
} else {
  cp.execSync("npm ci --omit=dev --ignore-scripts --no-audit --no-fund", {
    cwd: OUT_DIR, stdio: "inherit",
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 4. copy manifest
fs.copySync("deploy-manifest.json",
            path.join(OUT_ROOT, "deploy-manifest.json"));

// ──────────────────────────────────────────────────────────────────────────
// 5. diagnostics
console.log("✅  Entry-point:", entry);
console.log("Files in bundle (excluding node_modules):",
  fs.readdirSync(OUT_DIR).filter(f => f !== "node_modules"));
