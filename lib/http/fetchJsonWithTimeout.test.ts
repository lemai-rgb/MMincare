import assert from "node:assert/strict";

import { fetchJsonWithTimeout, InvalidJsonResponseError, RequestTimeoutError } from "./fetchJsonWithTimeout";

const originalFetch = globalThis.fetch;

async function run() {
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
  const success = await fetchJsonWithTimeout("/ok", {}, 100);
  assert.deepEqual(success.payload, { ok: true });

  globalThis.fetch = (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  await assert.rejects(fetchJsonWithTimeout("/timeout", {}, 10), RequestTimeoutError);

  const parent = new AbortController();
  const pending = fetchJsonWithTimeout("/abort", { signal: parent.signal }, 1000);
  parent.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");

  globalThis.fetch = async (_input, init) => ({
    status: 200,
    json: () => new Promise<unknown>((_resolve, reject) => init?.signal?.addEventListener(
      "abort",
      () => reject(new DOMException("aborted", "AbortError")),
      { once: true },
    )),
  } as Response);
  await assert.rejects(fetchJsonWithTimeout("/body-timeout", {}, 10), RequestTimeoutError);

  const bodyParent = new AbortController();
  globalThis.fetch = async () => ({
    status: 200,
    json: () => new Promise<unknown>((_resolve, reject) => {
      bodyParent.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }),
  } as Response);
  const bodyPending = fetchJsonWithTimeout("/body-abort", { signal: bodyParent.signal }, 1000);
  bodyParent.abort();
  await assert.rejects(bodyPending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");

  globalThis.fetch = async () => new Response("not-json", { headers: { "content-type": "text/plain" } });
  await assert.rejects(fetchJsonWithTimeout("/invalid", {}, 100), InvalidJsonResponseError);
  console.log("Fetch timeout lifecycle tests passed.");
}

run().finally(() => {
  globalThis.fetch = originalFetch;
});
