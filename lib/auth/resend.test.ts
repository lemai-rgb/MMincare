import assert from "node:assert/strict";

import { createResendController, type ResendTimer } from "./resend";
import { shouldShowEmailConfirmation } from "./signup";

function createFakeTimer() {
  const callbacks = new Map<number, () => void>();
  let nextId = 1;
  let clearCount = 0;
  const timer: ResendTimer = {
    setInterval(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    clearInterval(identifier) {
      clearCount += 1;
      callbacks.delete(identifier as number);
    },
  };
  return {
    timer,
    tick() {
      for (const callback of [...callbacks.values()]) callback();
    },
    get activeTimers() {
      return callbacks.size;
    },
    get clearCount() {
      return clearCount;
    },
  };
}

async function run() {
  assert.equal(shouldShowEmailConfirmation({ session: null }, null), true);
  assert.equal(shouldShowEmailConfirmation({ session: {} }, null), false);

  const successfulTimer = createFakeTimer();
  let successfulRequests = 0;
  const successfulController = createResendController({
    timer: successfulTimer.timer,
    send: async () => {
      successfulRequests += 1;
      return {};
    },
  });
  const firstRequest = successfulController.resend();
  const secondRequest = successfulController.resend();
  assert.equal(await firstRequest, true);
  assert.equal(await secondRequest, false);
  assert.equal(successfulRequests, 1);
  assert.equal(successfulController.getState().message, "Đã gửi lại email xác nhận. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.");
  assert.equal(successfulController.getState().cooldownSeconds, 60);
  successfulTimer.tick();
  assert.equal(successfulController.getState().cooldownSeconds, 59);
  assert.equal(await successfulController.resend(), false);
  successfulController.dispose();
  assert.equal(successfulTimer.activeTimers, 0);
  assert.equal(successfulTimer.clearCount, 1);

  const rateLimitTimer = createFakeTimer();
  let rateLimitRequests = 0;
  const rateLimitController = createResendController({
    timer: rateLimitTimer.timer,
    send: async () => {
      rateLimitRequests += 1;
      return { error: { status: 429, message: "raw provider error" } };
    },
  });
  assert.equal(await rateLimitController.resend(), false);
  assert.equal(rateLimitRequests, 1);
  assert.equal(rateLimitController.getState().error, "Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.");
  assert.equal(await rateLimitController.resend(), false);
  assert.equal(rateLimitRequests, 1);
  rateLimitController.dispose();

  console.log("Auth resend behavior tests passed.");
}

void run();
