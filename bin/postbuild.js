// bin/postbuild.js
// Builds the .amplify-hosting bundle for Amplify Hosting Compute
const fs = require("fs-extra");
const path = require("path");

const OUT = ".amplify-hosting/compute/default";

fs.removeSync(".amplify-hosting").catch(() => {});  // clean previous bundle
fs.ensureDirSync(OUT);

// 1 – runtime code produced by `medusa build`
fs.copySync(".medusa/server", OUT, { recursive: true });

// 2 – dependencies
fs.copySync("node_modules", path.join(OUT, "node_modules"), { recursive: true });

// 3 – deployment manifest
fs.copySync("deploy-manifest.json", ".amplify-hosting/deploy-manifest.json");
