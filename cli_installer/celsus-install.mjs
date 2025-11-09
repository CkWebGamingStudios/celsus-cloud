import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import AdmZip from "adm-zip";

const registryUrl =
  "https://celsus-cloud.pages.dev/plugins.json";

async function installPlugin(pluginName) {
  console.log(`🔍 Searching for plugin "${pluginName}"...`);

  // Fetch plugin registry
  const res = await fetch(registryUrl);
  const registry = await res.json();
  const plugin = registry.plugins.find(
    (p) => p.id.toLowerCase() === pluginName.toLowerCase()
  );

  if (!plugin) {
    console.error(`❌ Plugin "${pluginName}" not found in registry.`);
    return;
  }

  console.log(`⬇️  Downloading ${plugin.name} v${plugin.version}...`);
  const zipResponse = await fetch(plugin.url);
  if (!zipResponse.ok) throw new Error("Download failed: " + zipResponse.statusText);

  const arrayBuffer = await zipResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Setup directories
  const celsusDir = path.join(process.cwd(), "Celsus_modules");
  const pluginDir = path.join(celsusDir, plugin.name);

  fs.mkdirSync(celsusDir, { recursive: true });

  const tempZip = path.join(celsusDir, `${plugin.name}.zip`);
  fs.writeFileSync(tempZip, buffer);

  console.log("📦 Extracting to Celsus_modules...");
  try {
    const zip = new AdmZip(tempZip);
    zip.extractAllTo(pluginDir, true);
  } catch (e) {
    console.error("❌ Installer error: invalid zip file:", e.message);
    return;
  }

  // Merge folders (public/src)
  const publicFolder = path.join(pluginDir, "public");
  const srcFolder = path.join(pluginDir, "src");

  if (fs.existsSync(publicFolder)) {
    console.log("📁 Merging /public...");
    fs.cpSync(publicFolder, path.join(process.cwd(), "public"), { recursive: true });
  }

  if (fs.existsSync(srcFolder)) {
    console.log("📁 Merging /src...");
    fs.cpSync(srcFolder, path.join(process.cwd(), "src"), { recursive: true });
  }

  // Update registry.json
  const localRegistryPath = path.join(celsusDir, "registry.json");
  let localRegistry = [];

  if (fs.existsSync(localRegistryPath)) {
    try {
      localRegistry = JSON.parse(fs.readFileSync(localRegistryPath, "utf-8"));
    } catch {
      localRegistry = [];
    }
  }

  const existingIndex = localRegistry.findIndex((p) => p.id === plugin.id);
  if (existingIndex >= 0) localRegistry.splice(existingIndex, 1);
  localRegistry.push({
    id: plugin.id,
    version: plugin.version,
    installedAt: new Date().toISOString(),
  });

  fs.writeFileSync(localRegistryPath, JSON.stringify(localRegistry, null, 2));

  // Cleanup
  fs.unlinkSync(tempZip);

  console.log(`✅ Installed ${plugin.name} v${plugin.version} successfully!`);
  console.log(`📂 Location: ${pluginDir}`);
}

const pluginName = process.argv[2];
if (!pluginName) {
  console.log("⚙️ Usage: node celsus-install.mjs <plugin-name>");
  process.exit(1);
}

// choose correct registry URL
const LOCAL_REGISTRY = "file:///E:/Projects/celsus-cloud/functions/api/plugins.json";
const CLOUD_REGISTRY = "https://celsus-cloud.pages.dev/plugins.json";

let REGISTRY_URL = CLOUD_REGISTRY;

try {
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) throw new Error("Cloud unreachable");
} catch {
  console.warn("⚠️ Using local registry instead.");
  REGISTRY_URL = LOCAL_REGISTRY;
}

// Run installer
installPlugin(pluginName)
  .then(() => console.log("🎉 Installation process complete."))
  .catch((err) => console.error("❌ Installer failed:", err));

