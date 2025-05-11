/* bin/postbuild.js */
const fs   = require("fs-extra");
const path = require("path");

const OUT = ".amplify-hosting/compute/default";

// 1. clean previous bundle
try {
  fs.removeSync(".amplify-hosting");
} catch (_) {
  /* ignore – folder may not exist */
}

fs.ensureDirSync(OUT);

// 2. runtime code
fs.copySync(".medusa/server", OUT, { recursive: true });

// 3. dependencies
fs.copySync("node_modules", path.join(OUT, "node_modules"), { recursive: true });

// 4. deployment manifest
fs.copySync("deploy-manifest.json", ".amplify-hosting/deploy-manifest.json");

// Log the manifest content to verify what's being copied
console.log(
  "Manifest content:",
  fs.readFileSync(".amplify-hosting/deploy-manifest.json", "utf8")
);
