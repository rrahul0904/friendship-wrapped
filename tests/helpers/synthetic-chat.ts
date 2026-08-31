export interface SyntheticChatOptions {
  messages: number;
  participants?: number;
  seed?: number;
  start?: Date;
  minutesBetweenMessages?: number;
}

function participantName(index: number) {
  return `Person ${index + 1}`;
}

export function makeSyntheticChat({
  messages,
  participants = 4,
  seed = 42,
  start = new Date(2024, 0, 1, 8, 0, 0),
  minutesBetweenMessages = 7,
}: SyntheticChatOptions) {
  if (!Number.isInteger(messages) || messages < 0) throw new Error("messages must be a non-negative integer");
  if (!Number.isInteger(participants) || participants < 1) throw new Error("participants must be a positive integer");

  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };

  const lines: string[] = [];
  let timestamp = start.getTime();

  for (let index = 0; index < messages; index++) {
    const sender = participantName(index % participants);
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    let hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");
    const meridiem = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    const token = Math.floor(random() * 10_000);
    let body = `message ${token} project coffee`;
    if (index % 17 === 0) body += "?";
    if (index % 31 === 0) body += " 😂";
    if (index % 43 === 0) body += " ❤️";
    if (index % 59 === 0) body = "<Media omitted>";

    lines.push(`${month}/${day}/${year}, ${hour}:${minute} ${meridiem} - ${sender}: ${body}`);
    if (index % 97 === 0) lines.push(`continuation ${index}`);

    const gap = index > 0 && index % 401 === 0 ? 8 * 60 : minutesBetweenMessages;
    timestamp += gap * 60_000;
  }

  return lines.join("\n");
}
