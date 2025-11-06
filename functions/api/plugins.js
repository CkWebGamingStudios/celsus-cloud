export async function onRequest() {
  const plugins = await import('./plugins.json', { assert: { type: 'json' } })
    .then(m => m.default);

  return new Response(JSON.stringify({ plugins }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
