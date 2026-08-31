/// <reference lib="webworker" />

import type { DateOrder } from "@/lib/types";
import { whatsappTextImporter } from "@/platform/importers/whatsapp";

type WorkerRequest = {
  id: number;
  input: { name: string; type?: string; size?: number; text: string };
  dateOrder: DateOrder;
};

type WorkerResponse =
  | { id: number; ok: true; payload: Awaited<ReturnType<typeof whatsappTextImporter.parse>> }
  | { id: number; ok: false; error: string };

const worker = self as unknown as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, input, dateOrder } = event.data;
  try {
    if (!whatsappTextImporter.canHandle(input)) throw new Error("This file is not a supported WhatsApp text export.");
    const payload = await whatsappTextImporter.parse(input, { dateOrder });
    const response: WorkerResponse = { id, ok: true, payload };
    worker.postMessage(response);
  } catch (cause) {
    const response: WorkerResponse = { id, ok: false, error: cause instanceof Error ? cause.message : "Could not analyze this chat." };
    worker.postMessage(response);
  }
};

export {};
