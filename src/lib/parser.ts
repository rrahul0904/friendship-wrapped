import type { ChatMessage, DateOrder } from "./types";

const ANDROID = /^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s+-\s+([^:]+):\s?(.*)$/;
const IOS = /^\[(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s+([^:]+):\s?(.*)$/;
const TIMESTAMPED_LINE = /^\[?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},\s+\d{1,2}:\d{2}/;
const DIRECTION_MARKS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const UNICODE_SPACES = /[\u00a0\u2007\u2009\u202f]/g;

function normalizeYear(year: number) {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function normalizeExport(raw: string) {
  return raw
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

function parseDate(dateRaw: string, timeRaw: string, order: DateOrder) {
  const parts = dateRaw.split(/[\/.\-]/).map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;

  const [a, b, rawYear] = parts;
  const year = normalizeYear(rawYear);
  let month: number;
  let day: number;

  // "auto" is intentionally US-first for ambiguous dates, while dates whose
  // first field cannot be a month are treated as DD/MM.
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

  // Date normalizes impossible dates (for example Feb 31 -> Mar 3). Require
  // every requested component to round-trip unchanged before accepting it.
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

export function parseChat(raw: string, order: DateOrder = "auto"): ChatMessage[] {
  const lines = normalizeExport(raw).split("\n");
  const messages: ChatMessage[] = [];

  for (const line of lines) {
    const match = line.match(ANDROID) ?? line.match(IOS);
    if (match) {
      const timestamp = parseDate(match[1], match[2], order);
      if (!timestamp) continue;

      const sender = match[3].trim();
      if (!sender || /messages and calls are end-to-end encrypted/i.test(sender)) continue;

      messages.push({ sender, timestamp, text: match[4] ?? "" });
      continue;
    }

    // Timestamped system/malformed lines must never become part of the prior
    // user's message. Ordinary non-timestamped continuation lines are allowed.
    if (TIMESTAMPED_LINE.test(line)) continue;

    if (messages.length && line.trim()) {
      messages[messages.length - 1].text += `\n${line.trim()}`;
    }
  }

  return messages;
}
