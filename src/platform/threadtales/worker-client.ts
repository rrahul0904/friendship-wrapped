import type { DateOrder } from "@/lib/types";
import type { ParseResult } from "@/platform/importers/types";
import { getChatImporter } from "@/platform/importers";

let sequence = 0;

export interface ThreadTalesAnalysisInput { name: string; type?: string; size?: number; text: string; }

export async function analyzeThreadTaleInput(input: ThreadTalesAnalysisInput, dateOrder: DateOrder): Promise<ParseResult> {
  const importer = getChatImporter(input);
  if (!importer) throw new Error("Choose a supported WhatsApp .txt or Telegram .json chat export.");
  if (typeof Worker === "undefined") return importer.parse(input, { dateOrder });
  const worker = new Worker(new URL("../../workers/threadtales.worker.ts", import.meta.url), { type: "module" });
  const id = ++sequence;
  return new Promise<ParseResult>((resolve, reject) => {
    const cleanup = () => worker.terminate();
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error("This chat is taking unusually long to process. Try a smaller export.")); }, 60_000);
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; payload?: ParseResult; error?: string }>) => {
      if (event.data.id !== id) return;
      window.clearTimeout(timeout); cleanup();
      if (event.data.ok && event.data.payload) resolve(event.data.payload);
      else reject(new Error(event.data.error ?? "Could not analyze this chat."));
    };
    worker.onerror = () => { window.clearTimeout(timeout); cleanup(); reject(new Error("The background analyzer failed. Please retry this export.")); };
    worker.postMessage({ id, input, dateOrder });
  });
}
