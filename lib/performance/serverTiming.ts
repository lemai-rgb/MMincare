type TimingStatus = "ok" | "error" | "aborted";

export function createServerTiming(requestName: string) {
  const enabled = process.env.MINCARE_PERF_LOG === "1";
  const requestId = enabled ? crypto.randomUUID() : "disabled";
  const startedAt = performance.now();
  let finished = false;
  let hadStageError = false;

  function containsQueryError(value: unknown): boolean {
    if (Array.isArray(value)) return value.some(containsQueryError);
    if (!value || typeof value !== "object" || !("error" in value)) return false;
    return Boolean((value as { error?: unknown }).error);
  }

  function finish(status: TimingStatus = "ok") {
    if (finished) return;
    finished = true;
    if (!enabled) return;
    const finalStatus = status === "ok" && hadStageError ? "error" : status;
    console.info("[MINCARE-PERF]", {
      request: requestName,
      request_id: requestId,
      stage: "total",
      status: finalStatus,
      duration_ms: Math.round(performance.now() - startedAt),
    });
  }

  async function measure<T>(stage: string, operation: () => PromiseLike<T>) {
    const stageStartedAt = performance.now();
    try {
      const value = await operation();
      const stageHasError = containsQueryError(value);
      if (stageHasError) hadStageError = true;
      if (enabled) {
        console.info("[MINCARE-PERF]", {
          request: requestName,
          request_id: requestId,
          stage,
          status: stageHasError ? "error" : "ok",
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
