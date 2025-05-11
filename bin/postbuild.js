/* bin/postbuild.js
 * Prepares the bundle Amplify Hosting Compute expects.
 * 1. Clean previous bundle
 * 2. Copy Medusa build (.medusa/server)
 * 3. Ensure index.js exists (rename/duplicate if needed)
 * 4. Install production-only dependencies
 * 5. Copy deploy-manifest.json
 * 6. Print diagnostics
 */

const fs  = require("fs-extra");
const cp  = require("child_process");
const path = require("path");

const OUT_ROOT = ".amplify-hosting";
const OUT_DIR  = path.join(OUT_ROOT, "compute", "default");

// ─── 1. clean previous bundle ──────────────────────────────────────────────
try { fs.removeSync(OUT_ROOT); } catch (_) {}
fs.ensureDirSync(OUT_DIR);

// ─── 2. copy Medusa server output ─────────────────────────────────────────
fs.copySync(".medusa/server", OUT_DIR, { recursive: true });

// ─── 3. guarantee index.js ────────────────────────────────────────────────
const candidates = ["index.js", "server.js", "index.mjs", "app.js", "main.js"];
let entry = candidates.find(f => fs.existsSync(path.join(OUT_DIR, f)));

if (!entry) {
  // fallback stub (should never be used in production)
  fs.writeFileSync(
    path.join(OUT_DIR, "index.js"),
    'console.error("No entry-point found – exiting"); process.exit(1);'
  );
  entry = "index.js";
} else if (entry !== "index.js") {
  fs.copySync(path.join(OUT_DIR, entry), path.join(OUT_DIR, "index.js"));
}

// ─── 4. install prod-only dependencies ────────────────────────────────────
fs.copySync("package.json", path.join(OUT_DIR, "package.json"));

if (fs.existsSync("yarn.lock")) {
  fs.copySync("yarn.lock", path.join(OUT_DIR, "yarn.lock"));
  cp.execSync("yarn install --production --frozen-lockfile", {
    cwd: OUT_DIR,
    stdio: "inherit",
  });
} else {
  fs.copySync("package-lock.json", path.join(OUT_DIR, "package-lock.json"));
  cp.execSync(
    "npm ci --omit=dev --ignore-scripts --no-audit --no-fund",
    { cwd: OUT_DIR, stdio: "inherit" }
  );
}

// ─── 5. copy deploy-manifest.json ─────────────────────────────────────────
fs.copySync(
  "deploy-manifest.json",
  path.join(OUT_ROOT, "deploy-manifest.json")
);

// ─── 6. diagnostics ───────────────────────────────────────────────────────
const manifestText = fs.readFileSync(
  path.join(OUT_ROOT, "deploy-manifest.json"),
  "utf8"
);
console.log("Manifest content:", manifestText);
console.log(
  "Files in bundle:",
  fs.readdirSync(OUT_DIR).filter(f => f !== "node_modules")
);
