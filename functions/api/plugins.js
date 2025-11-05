export async function onRequest() {
  const plugins = [
    {
      id: "Hypershell",
      name: "Celsus Hypershell",
      version: "1.0.0",
      description: "Interactive terminal shell for Celsus.",
      url: "/plugins/hypershell-1.0.0.zip" // or external absolute URL
    },
    {
      id: "CPME",
      name: "Celsus Project Manager & Editor",
      version: "1.0.0",
      description: "GUI dashboard for Celsus projects.",
      url: "/plugins/cpme-1.0.0.zip"
    }
  ];
  return new Response(JSON.stringify({ plugins }, null, 2), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
