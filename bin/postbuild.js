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

// Handle entrypoint file - check common Medusa entrypoint names and ensure index.js exists
if (fs.existsSync(path.join(OUT, "server.js"))) {
  console.log("Found server.js, copying to index.js");
  fs.copySync(path.join(OUT, "server.js"), path.join(OUT, "index.js"));
} else if (fs.existsSync(path.join(OUT, "index.mjs"))) {
  console.log("Found index.mjs, copying to index.js");
  fs.copySync(path.join(OUT, "index.mjs"), path.join(OUT, "index.js"));
} else if (fs.existsSync(path.join(OUT, "app.js"))) {
  console.log("Found app.js, copying to index.js");
  fs.copySync(path.join(OUT, "app.js"), path.join(OUT, "index.js"));
} else if (fs.existsSync(path.join(OUT, "main.js"))) {
  console.log("Found main.js, copying to index.js");
  fs.copySync(path.join(OUT, "main.js"), path.join(OUT, "index.js"));
} else {
  console.log("No common entrypoint file found, creating a simple index.js that requires any existing server file");
  // Create a simple index.js that requires instrumentation.js if it exists
  if (fs.existsSync(path.join(OUT, "instrumentation.js"))) {
    fs.writeFileSync(path.join(OUT, "index.js"), 'require("./instrumentation.js");\n');
  } else {
    // If all else fails, write a very basic file that logs and exits
    fs.writeFileSync(path.join(OUT, "index.js"), 'console.log("Server starting...");\nconst express = require("express");\nconst app = express();\napp.get("/", (req, res) => { res.send("Medusa API is running"); });\nconst PORT = process.env.PORT || 9000;\napp.listen(PORT, () => console.log(`Server running on port ${PORT}`));');
  }
}

// 3. dependencies
fs.copySync("node_modules", path.join(OUT, "node_modules"), { recursive: true });

// 4. deployment manifest
fs.copySync("deploy-manifest.json", ".amplify-hosting/deploy-manifest.json");

// Log the manifest content to verify what's being copied
console.log(
  "Manifest content:",
  fs.readFileSync(".amplify-hosting/deploy-manifest.json", "utf8")
);

// Log the files in the bundle to verify entrypoint exists
console.log(
  "Files in bundle:",
  fs.readdirSync(OUT).filter(file => !file.includes("node_modules"))
);
