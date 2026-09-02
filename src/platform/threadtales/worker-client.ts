import type { DateOrder } from "@/lib/types";
import { getChatImporter } from "@/platform/importers";
import type { ParseResult } from "@/platform/importers/types";

let sequence = 0;
export interface ThreadTalesAnalysisInput { name: string; type?: string; size?: number; text: string; }

function cancellationError() { const error = new Error("Analysis cancelled."); error.name = "AbortError"; return error; }

export async function analyzeThreadTaleInput(input: ThreadTalesAnalysisInput, dateOrder: DateOrder, signal?: AbortSignal): Promise<ParseResult> {
  const importer = getChatImporter(input);
  if (!importer) throw new Error("Choose a supported WhatsApp .txt or Telegram .json chat export.");
  if (signal?.aborted) throw cancellationError();
  if (typeof Worker === "undefined") {
    const result = await importer.parse(input, { dateOrder });
    if (signal?.aborted) throw cancellationError();
    return result;
  }

  const worker = new Worker(new URL("../../workers/threadtales.worker.ts", import.meta.url), { type: "module" });
  const id = ++sequence;
  return new Promise<ParseResult>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => finish(() => reject(new Error("This chat is taking unusually long to process. Try a smaller export."))), 60_000);
    const onAbort = () => finish(() => reject(cancellationError()));
    const cleanup = () => { window.clearTimeout(timeout); signal?.removeEventListener("abort", onAbort); worker.terminate(); };
    const finish = (callback: () => void) => { if (settled) return; settled = true; cleanup(); callback(); };

    signal?.addEventListener("abort", onAbort, { once: true });
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; payload?: ParseResult; error?: string }>) => {
      if (event.data.id !== id || settled) return;
      const payload = event.data.payload;
      if (event.data.ok && payload) finish(() => resolve(payload));
      else finish(() => reject(new Error(event.data.error ?? "Could not analyze this chat.")));
    };
    worker.onerror = () => finish(() => reject(new Error("The background analyzer failed. Please retry this export.")));
    worker.postMessage({ id, input, dateOrder });
  });
}
