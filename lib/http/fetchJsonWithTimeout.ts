export class RequestTimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "RequestTimeoutError";
  }
}

export class InvalidJsonResponseError extends Error {
  constructor() {
    super("Response was not valid JSON");
    this.name = "InvalidJsonResponseError";
  }
}

export async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<{ response: Response; payload: unknown }> {
  const controller = new AbortController();
  let timedOut = false;
  const parentSignal = init.signal;
  const onAbort = () => controller.abort();
  parentSignal?.addEventListener("abort", onAbort, { once: true });
  if (parentSignal?.aborted) controller.abort();
  const timer = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (timedOut) throw new RequestTimeoutError();
    let payload: unknown = null;
    if (response.status !== 204) {
      try {
        payload = await response.json();
      } catch {
        throw new InvalidJsonResponseError();
      }
    }
    return { response, payload };
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError();
    throw error;
  } finally {
    globalThis.clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onAbort);
  }
}
