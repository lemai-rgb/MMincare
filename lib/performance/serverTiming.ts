type TimingStatus = "ok" | "error" | "aborted";

export function createServerTiming(requestName: string) {
  const enabled = process.env.MINCARE_PERF_LOG === "1";
  const requestId = enabled ? crypto.randomUUID() : "disabled";
  const startedAt = performance.now();
  let finished = false;

  function finish(status: TimingStatus = "ok") {
    if (finished) return;
    finished = true;
    if (!enabled) return;
    console.info("[MINCARE-PERF]", {
      request: requestName,
      request_id: requestId,
      stage: "total",
      status,
      duration_ms: Math.round(performance.now() - startedAt),
    });
  }

  async function measure<T>(stage: string, operation: () => PromiseLike<T>) {
    const stageStartedAt = performance.now();
    try {
      const value = await operation();
      if (enabled) {
        console.info("[MINCARE-PERF]", {
          request: requestName,
          request_id: requestId,
          stage,
          status: "ok",
          duration_ms: Math.round(performance.now() - stageStartedAt),
        });
      }
      return value;
    } catch (error) {
      const status: TimingStatus = error instanceof Error && error.name === "AbortError" ? "aborted" : "error";
      if (enabled) {
        console.info("[MINCARE-PERF]", {
          request: requestName,
          request_id: requestId,
          stage,
          status,
          duration_ms: Math.round(performance.now() - stageStartedAt),
        });
      }
      finish(status);
      throw error;
    }
  }

  return { measure, finish };
}
