#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';
import AdmZip from 'adm-zip';

const API_BASE = process.env.CELSUS_API || 'https://<your-pages>.pages.dev';

function pluginDir(){
  const homedir = process.env.HOME || process.env.USERPROFILE;
  const d = path.join(homedir, '.celsus', 'plugins');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function download(url, dest){
  return new Promise((res, rej)=>{
    const file = fs.createWriteStream(dest);
    https.get(url, r=>{
      if (r.statusCode >= 400) return rej(new Error('Download failed ' + r.statusCode));
      r.pipe(file);
      file.on('finish', ()=>file.close(res));
    }).on('error', rej);
  });
}

async function install(id){
  id = id.toLowerCase();
  const metaR = await fetch(API_BASE + '/api/plugin/' + id);
  if (!metaR.ok) { console.error('Plugin not found'); process.exit(1); }
  const plugin = await metaR.json();
  const destZip = path.join(pluginDir(), plugin.id + '.zip');
  console.log('Downloading', plugin.url);
  const downloadUrl = plugin.url.startsWith('http') ? plugin.url : (API_BASE + plugin.url);
  await download(downloadUrl, destZip);
  const zip = new AdmZip(destZip);
  const extractPath = path.join(pluginDir(), plugin.id);
  zip.extractAllTo(extractPath, true);
  fs.unlinkSync(destZip);
  // update manifest
  const mfile = path.join(pluginDir(), 'manifest.json');
  let manifest = { installed: [] };
  if (fs.existsSync(mfile)) manifest = JSON.parse(fs.readFileSync(mfile));
  manifest.installed = manifest.installed.filter(x=> x.id !== plugin.id);
  manifest.installed.push({ id: plugin.id, version: plugin.version, path: extractPath });
  fs.writeFileSync(mfile, JSON.stringify(manifest, null, 2));
  console.log('Installed', plugin.id, '→', extractPath);
}

const args = process.argv.slice(2);
if (!args[0]) { console.log('Usage: node celsus-plugin-installer.js <PluginID>'); process.exit(0); }
install(args[0]).catch(e=>{ console.error(e); process.exit(1); });
