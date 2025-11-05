export async function onRequest(context) {
  const id = (context.params.id || '').toLowerCase();
  const all = {
    "hypershell": {
      id: "Hypershell",
      name: "Celsus Hypershell",
      version: "1.0.0",
      description: "Interactive terminal shell for Celsus.",
      url: "/plugins/hypershell-1.0.0.zip"
    },
    "cpme": {
      id: "CPME",
      name: "Celsus Project Manager & Editor",
      version: "1.0.0",
      description: "GUI dashboard for Celsus projects.",
      url: "/plugins/cpme-1.0.0.zip"
    }
  };
  const plugin = all[id];
  if (!plugin) return new Response(JSON.stringify({ error: "Plugin not found" }), { status: 404, headers: { "Access-Control-Allow-Origin":"*" }});
  return new Response(JSON.stringify(plugin, null, 2), {
    headers: { "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
  });
}
