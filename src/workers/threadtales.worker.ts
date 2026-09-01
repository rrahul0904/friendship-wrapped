/// <reference lib="webworker" />

import type { DateOrder } from "@/lib/types";
import { getChatImporter } from "@/platform/importers";
import type { ParseResult } from "@/platform/importers/types";

type WorkerRequest = { id: number; input: { name: string; type?: string; size?: number; text: string }; dateOrder: DateOrder; };
type WorkerResponse = { id: number; ok: true; payload: ParseResult } | { id: number; ok: false; error: string };
const worker = self as unknown as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, input, dateOrder } = event.data;
  try {
    const importer = getChatImporter(input);
    if (!importer) throw new Error("Choose a supported WhatsApp .txt or Telegram .json chat export.");
    const payload = await importer.parse(input, { dateOrder });
    const response: WorkerResponse = { id, ok: true, payload };
    worker.postMessage(response);
  } catch (cause) {
    const response: WorkerResponse = { id, ok: false, error: cause instanceof Error ? cause.message : "Could not analyze this chat." };
    worker.postMessage(response);
  }
};

export {};
