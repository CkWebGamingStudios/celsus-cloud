import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// --- Parse CLI arguments ---
const args = process.argv.slice(2);
if (args.length < 8) {
  console.error("❌ Usage: node celsus-publish.mjs <zipPath> --id <id> --version <v> --desc <desc> --url <url>");
  process.exit(1);
}

const idIndex = args.indexOf("--id");
const versionIndex = args.indexOf("--version");
const descIndex = args.indexOf("--desc");
const urlIndex = args.indexOf("--url");

const id = args[idIndex + 1];
const version = args[versionIndex + 1];
const desc = args[descIndex + 1];
const url = args[urlIndex + 1];

const jsonPath = path.join(process.cwd(), "functions", "api", "plugins.json");

// --- Read plugins.json ---
let plugins = [];
try {
  const raw = fs.readFileSync(jsonPath, "utf8");
  plugins = JSON.parse(raw);
} catch (e) {
  console.warn("⚠️ Could not read or parse plugins.json, creating new one.");
  plugins = [];
}

// --- Update or add plugin ---
const existingIndex = plugins.findIndex(p => p.id === id);
if (existingIndex >= 0) {
  console.log(`🔁 Updating existing plugin: ${id}`);
  plugins[existingIndex] = { id, name: id, version, description: desc, url };
} else {
  console.log(`➕ Adding new plugin: ${id}`);
  plugins.push({ id, name: id, version, description: desc, url });
}

// --- Write updated JSON ---
fs.writeFileSync(jsonPath, JSON.stringify(plugins, null, 2), "utf8");
console.log(`✅ Updated plugins.json (${plugins.length} total plugins)`);

// --- Optional Git commit ---
try {
  execSync(`git add functions/api/plugins.json`, { stdio: "inherit" });
  execSync(`git commit -m "Update plugin registry for ${id || "unknown"} v${version || "unknown"}"`);
  execSync(`git push origin main`, { stdio: "inherit" });
  console.log("✅ Changes pushed successfully to remote repository.");
} catch (err) {
  console.warn("⚠️ Git push skipped or failed:", err.message);
}
