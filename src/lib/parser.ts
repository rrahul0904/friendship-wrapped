import type {
  ChatMessage,
  ChatSourceFormat,
  DateOrder,
  DateOrderDetection,
  ParsedChat,
  ResolvedDateOrder,
} from "./types";

const ANDROID = /^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s+-\s+([^:]+):\s?(.*)$/;
const IOS = /^\[(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s+([^:]+):\s?(.*)$/;
const TIMESTAMPED_LINE = /^\[?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},\s+\d{1,2}:\d{2}/;
const DIRECTION_MARKS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const UNICODE_SPACES = /[\u00a0\u2007\u2009\u202f]/g;
const BOM = /^\uFEFF/;

function normalizeYear(year: number) {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

export function normalizeChatExport(raw: string) {
  return raw
    .replace(BOM, "")
    .replace(DIRECTION_MARKS, "")
    .replace(UNICODE_SPACES, " ")
    .replace(/\r\n?/g, "\n");
}

function parseTime(timeRaw: string) {
  const match = timeRaw.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  const meridiem = match[4]?.toUpperCase();

  if (minute > 59 || second > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  return { hour, minute, second };
}

function dateParts(dateRaw: string) {
  const parts = dateRaw.split(/[\/.\-]/).map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  return { a: parts[0], b: parts[1], year: normalizeYear(parts[2]) };
}

export function detectDateOrder(raw: string): DateOrderDetection {
  const normalized = normalizeChatExport(raw);
  let mdyEvidence = 0;
  let dmyEvidence = 0;

  for (const line of normalized.split("\n")) {
    const match = line.match(ANDROID) ?? line.match(IOS);
    if (!match) continue;
    const parts = dateParts(match[1]);
    if (!parts) continue;

    if (parts.a > 12 && parts.b >= 1 && parts.b <= 12) dmyEvidence += 1;
    else if (parts.b > 12 && parts.a >= 1 && parts.a <= 12) mdyEvidence += 1;
  }

  const evidenceCount = mdyEvidence + dmyEvidence;
  if (dmyEvidence > 0 && mdyEvidence === 0) return { detected: "dmy", confidence: "high", evidenceCount };
  if (mdyEvidence > 0 && dmyEvidence === 0) return { detected: "mdy", confidence: "high", evidenceCount };
  return { detected: null, confidence: "ambiguous", evidenceCount };
}

function resolveDateOrder(raw: string, order: DateOrder) {
  const detection = detectDateOrder(raw);
  if (order === "mdy" || order === "dmy") return { dateOrder: order, detection } as const;
  return { dateOrder: detection.detected ?? "mdy", detection } as const;
}

function parseDate(dateRaw: string, timeRaw: string, order: ResolvedDateOrder) {
  const parts = dateParts(dateRaw);
  if (!parts) return null;

  const { a, b, year } = parts;
  const month = order === "dmy" ? b : a;
  const day = order === "dmy" ? a : b;
  const time = parseTime(timeRaw);
  if (!time || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day, time.hour, time.minute, time.second);
  if (Number.isNaN(date.getTime())) return null;

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== time.hour ||
    date.getMinutes() !== time.minute ||
    date.getSeconds() !== time.second
  ) {
    return null;
  }

  return date.getTime();
}

function mergeFormat(current: ChatSourceFormat, next: Exclude<ChatSourceFormat, "mixed" | "unknown">): ChatSourceFormat {
  if (current === "unknown") return next;
  if (current === next) return current;
  return "mixed";
}

export function parseChatDetailed(raw: string, order: DateOrder = "auto"): ParsedChat {
  const normalized = normalizeChatExport(raw);
  const { dateOrder, detection } = resolveDateOrder(normalized, order);
  const lines = normalized.split("\n");
  const messages: ChatMessage[] = [];
  let format: ChatSourceFormat = "unknown";

  for (const line of lines) {
    const androidMatch = line.match(ANDROID);
    const iosMatch = androidMatch ? null : line.match(IOS);
    const match = androidMatch ?? iosMatch;

    if (match) {
      const timestamp = parseDate(match[1], match[2], dateOrder);
      if (!timestamp) continue;

      const sender = match[3].trim();
      if (!sender || /messages and calls are end-to-end encrypted/i.test(sender)) continue;

      format = mergeFormat(format, androidMatch ? "android" : "ios");
      messages.push({ sender, timestamp, text: match[4] ?? "" });
      continue;
    }

    if (TIMESTAMPED_LINE.test(line)) continue;

    if (messages.length && line.trim()) {
      messages[messages.length - 1].text += `\n${line.trim()}`;
    }
  }

  return { messages, format, dateOrder, detection };
}

export function parseChat(raw: string, order: DateOrder = "auto"): ChatMessage[] {
  return parseChatDetailed(raw, order).messages;
}
