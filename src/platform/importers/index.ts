import type { ChatImporter, ImportInput } from "./types";
import { telegramJsonImporter } from "./telegram";
import { whatsappTextImporter } from "./whatsapp";

export const chatImporters: ChatImporter[] = [telegramJsonImporter, whatsappTextImporter];

export function getChatImporter(input: Pick<ImportInput, "name" | "type">) {
  return chatImporters.find((importer) => importer.canHandle(input)) ?? null;
}
