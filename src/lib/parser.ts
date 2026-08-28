import type { ChatMessage, DateOrder } from "./types";

const ANDROID = /^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s+-\s+([^:]+):\s?(.*)$/;
const IOS = /^\[(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s+([^:]+):\s?(.*)$/;

function normalizeYear(year: number) {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function parseTime(timeRaw: string) {
  const match = timeRaw.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  const meridiem = match[4]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

function parseDate(dateRaw: string, timeRaw: string, order: DateOrder) {
  const parts = dateRaw.split(/[\/.\-]/).map(Number);
  if (parts.length !== 3) return null;
  let [a, b, year] = parts;
  year = normalizeYear(year);

  let month: number;
  let day: number;
  if (order === "dmy" || (order === "auto" && a > 12)) {
    day = a;
    month = b;
  } else {
    month = a;
    day = b;
  }

  const time = parseTime(timeRaw);
  if (!time || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, time.hour, time.minute, time.second);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

export function parseChat(raw: string, order: DateOrder = "auto"): ChatMessage[] {
  const lines = raw.replace(/[\u200e\u200f]/g, "").replace(/\r\n/g, "\n").split("\n");
  const messages: ChatMessage[] = [];

  for (const line of lines) {
    const match = line.match(ANDROID) ?? line.match(IOS);
    if (match) {
      const timestamp = parseDate(match[1], match[2], order);
      if (!timestamp) continue;
      const sender = match[3].trim();
      if (/messages and calls are end-to-end encrypted/i.test(sender)) continue;
      messages.push({ sender, timestamp, text: match[4] ?? "" });
      continue;
    }

    // Timestamped WhatsApp system lines are ignored instead of being appended.
    if (/^\[?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},\s+\d{1,2}:\d{2}/.test(line)) continue;

    // Multiline chat messages are appended only in browser memory.
    if (messages.length && line.trim()) {
      messages[messages.length - 1].text += `\n${line.trim()}`;
    }
  }

  return messages;
}
