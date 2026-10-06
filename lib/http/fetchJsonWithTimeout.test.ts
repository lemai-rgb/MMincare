import assert from "node:assert/strict";

import { fetchJsonWithTimeout, InvalidJsonResponseError, RequestTimeoutError } from "./fetchJsonWithTimeout";

const originalFetch = globalThis.fetch;

async function run() {
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
  const success = await fetchJsonWithTimeout("/ok", {}, 100);
  assert.deepEqual(success.payload, { ok: true });

  globalThis.fetch = () => new Promise<Response>(() => undefined);
  await assert.rejects(fetchJsonWithTimeout("/timeout", {}, 10), RequestTimeoutError);

  const parent = new AbortController();
  const pending = fetchJsonWithTimeout("/abort", { signal: parent.signal }, 1000);
  parent.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");

  globalThis.fetch = async () => new Response("not-json", { headers: { "content-type": "text/plain" } });
  await assert.rejects(fetchJsonWithTimeout("/invalid", {}, 100), InvalidJsonResponseError);
  console.log("Fetch timeout lifecycle tests passed.");
}

run().finally(() => {
  globalThis.fetch = originalFetch;
});
