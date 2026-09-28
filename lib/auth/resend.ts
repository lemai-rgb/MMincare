import { mapAuthError, type AuthErrorResult } from "./errors";

export type ResendState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  error: string;
  cooldownSeconds: number;
};

export type ResendTimer = {
  setInterval(callback: () => void, milliseconds: number): unknown;
  clearInterval(identifier: unknown): void;
};

type ResendControllerOptions = {
  send: () => Promise<{ error?: unknown | null }>;
  cooldownSeconds?: number;
  timer?: ResendTimer;
};

const browserTimer: ResendTimer = {
  setInterval: (callback, milliseconds) => window.setInterval(callback, milliseconds),
  clearInterval: (identifier) => window.clearInterval(identifier as number),
};

export function createResendController({
  send,
  cooldownSeconds = 60,
  timer = browserTimer,
}: ResendControllerOptions) {
  let state: ResendState = {
    status: "idle",
    message: "",
    error: "",
    cooldownSeconds: 0,
  };
  let interval: unknown;
  let disposed = false;
  let started = false;
  const listeners = new Set<(nextState: ResendState) => void>();

  function emit(nextState: ResendState) {
    if (disposed) return;
    state = nextState;
    for (const listener of listeners) listener(state);
  }

  function stopTimer() {
    if (interval !== undefined) {
      timer.clearInterval(interval);
      interval = undefined;
    }
  }

  function startCooldown(seconds: number) {
    if (disposed) return;
    stopTimer();
    emit({ ...state, cooldownSeconds: seconds });
    interval = timer.setInterval(() => {
      const remaining = Math.max(0, state.cooldownSeconds - 1);
      if (remaining === 0) stopTimer();
      emit({ ...state, cooldownSeconds: remaining });
    }, 1000);
  }

  async function resend() {
    if (!started || disposed || state.status === "loading" || state.cooldownSeconds > 0) return false;

    emit({ ...state, status: "loading", message: "", error: "" });
    try {
      const result = await send();
      if (result.error) {
        const mapped = mapAuthError(result.error, { operation: "resend" });
        emit({ ...state, status: "error", error: mapped.message });
        if (mapped.cooldownSeconds) startCooldown(mapped.cooldownSeconds);
        return false;
      }

      emit({
        ...state,
        status: "success",
        message: "Đã gửi lại email xác nhận. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.",
        error: "",
      });
      startCooldown(cooldownSeconds);
      return true;
    } catch (error) {
      const mapped: AuthErrorResult = mapAuthError(error, { operation: "resend" });
      emit({ ...state, status: "error", error: mapped.message });
      if (mapped.cooldownSeconds) startCooldown(mapped.cooldownSeconds);
      return false;
    }
  }

  function start(initialCooldownSeconds = 0) {
    if (disposed || started) return false;
    started = true;
    if (initialCooldownSeconds > 0) startCooldown(initialCooldownSeconds);
    else emit({ ...state });
    return true;
  }

  return {
    getState: () => state,
    subscribe(listener: (nextState: ResendState) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    resend,
    dispose() {
      disposed = true;
      stopTimer();
      listeners.clear();
    },
  };
}
