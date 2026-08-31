import { describe, expect, it, vi } from "vitest";
import { createAnalysisTask } from "../../src/lib/worker-client";
import type { WorkerRequest } from "../../src/lib/worker-protocol";

class FakeWorker {
  onmessage: Worker["onmessage"] = null;
  onerror: Worker["onerror"] = null;
  readonly messages: unknown[] = [];
  terminated = false;

  postMessage(message: unknown) {
    this.messages.push(message);
  }

  terminate() {
    this.terminated = true;
  }
}

function requestId(worker: FakeWorker) {
  const request = worker.messages[0] as WorkerRequest;
  if (!request || request.type !== "ANALYZE_CHAT") throw new Error("analysis request was not posted");
  return request.requestId;
}

describe("worker client lifecycle", () => {
  it("rejects cancellation with AbortError and terminates the Worker", async () => {
    const worker = new FakeWorker();
    const task = createAnalysisTask("chat", "mdy", () => undefined, () => worker as unknown as Worker);
    const rejection = expect(task.promise).rejects.toMatchObject({ name: "AbortError" });

    task.cancel();

    await rejection;
    expect(worker.terminated).toBe(true);
    expect(worker.messages).toContainEqual({ type: "CANCEL", requestId: task.requestId });
  });

  it("ignores stale response ids while accepting progress for the active request", async () => {
    const worker = new FakeWorker();
    const onProgress = vi.fn();
    const task = createAnalysisTask("chat", "auto", onProgress, () => worker as unknown as Worker);
    const activeRequestId = requestId(worker);

    worker.onmessage?.(new MessageEvent("message", {
      data: { type: "PROGRESS", requestId: "stale-request", stage: "parsing" },
    }));
    expect(onProgress).not.toHaveBeenCalled();

    worker.onmessage?.(new MessageEvent("message", {
      data: { type: "PROGRESS", requestId: activeRequestId, stage: "analyzing", messageCount: 100 },
    }));
    expect(onProgress).toHaveBeenCalledWith({ stage: "analyzing", messageCount: 100 });

    const rejection = expect(task.promise).rejects.toMatchObject({ name: "AbortError" });
    task.cancel();
    await rejection;
  });
});
