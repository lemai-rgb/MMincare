export class RequestTimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "RequestTimeoutError";
  }
}

export class InvalidJsonResponseError extends Error {
  response?: Response;

  constructor(response?: Response) {
    super("Response was not valid JSON");
    this.name = "InvalidJsonResponseError";
    this.response = response;
  }
}

function createAbortError() {
  return new DOMException("The operation was aborted", "AbortError");
}

async function awaitAbortable<T>(
  value: PromiseLike<T>,
  signal: AbortSignal,
  getAbortError: () => Error,
) {
  if (signal.aborted) throw getAbortError();

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(getAbortError());
    };

    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(value).then(
      (result) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
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
    const getAbortError = () => timedOut ? new RequestTimeoutError() : createAbortError();
    const response = await awaitAbortable(fetch(input, { ...init, signal: controller.signal }), controller.signal, getAbortError);
    if (timedOut) throw new RequestTimeoutError();
    let payload: unknown = null;
    if (response.status !== 204) {
      try {
        payload = await awaitAbortable(response.json(), controller.signal, getAbortError);
      } catch {
        if (timedOut) throw new RequestTimeoutError();
        if (parentSignal?.aborted) throw createAbortError();
        throw new InvalidJsonResponseError(response);
      }
    }
    if (timedOut) throw new RequestTimeoutError();
    if (parentSignal?.aborted) throw createAbortError();
    return { response, payload };
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError();
    if (parentSignal?.aborted && !(error instanceof DOMException && error.name === "AbortError")) {
      throw createAbortError();
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onAbort);
  }
}
