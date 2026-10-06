type TimingStatus = "ok" | "error" | "aborted";

export function createServerTiming(requestName: string) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  async function measure<T>(stage: string, operation: () => PromiseLike<T>) {
    const stageStartedAt = performance.now();
    try {
      const value = await operation();
      console.info("[MINCARE-PERF]", { request: requestName, request_id: requestId, stage, status: "ok", duration_ms: Math.round(performance.now() - stageStartedAt) });
      return value;
    } catch (error) {
      const status: TimingStatus = error instanceof Error && error.name === "AbortError" ? "aborted" : "error";
      console.info("[MINCARE-PERF]", { request: requestName, request_id: requestId, stage, status, duration_ms: Math.round(performance.now() - stageStartedAt) });
      throw error;
    }
  }

  function finish(status: TimingStatus = "ok") {
    console.info("[MINCARE-PERF]", { request: requestName, request_id: requestId, stage: "total", status, duration_ms: Math.round(performance.now() - startedAt) });
  }

  return { measure, finish };
}
