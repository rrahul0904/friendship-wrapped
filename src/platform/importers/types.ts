import type { ChatMessage, ChatStats, DateOrder } from "@/lib/types";
import type { ThreadTaleResultV2 } from "@/platform/types";

export interface ImportInput {
  name: string;
  type?: string;
  size?: number;
  text: string;
}

export interface ParseOptions {
  dateOrder: DateOrder;
}

export interface ParseResult {
  messages: ChatMessage[];
  stats: ChatStats;
  result: ThreadTaleResultV2;
  warnings: string[];
}

export interface ChatImporter {
  id: string;
  label: string;
  canHandle(input: Pick<ImportInput, "name" | "type">): boolean;
  parse(input: ImportInput, options: ParseOptions): Promise<ParseResult>;
}
