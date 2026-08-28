export function makeSampleChat() {
  const names = ["Maya", "Jordan"];
  const phrases = [
    "did you survive today 😂", "I have a story for you", "no way hahaha", "coffee tomorrow?", "you are ridiculous ❤️",
    "wait what happened??", "sending you the photo", "okay this is actually hilarious", "remember that trip?", "I knew you'd say that",
    "call me when you're free", "good luck today!!", "you've got this 💛", "we need to plan another weekend", "why are we like this 😂"
  ];
  const lines: string[] = [];
  const start = new Date(2023, 1, 3, 9, 10);
  for (let i = 0; i < 420; i++) {
    const d = new Date(start.getTime() + i * 36 * 60 * 60 * 1000 + (i % 7) * 11 * 60 * 1000);
    const sender = names[i % 2];
    const phrase = phrases[(i * 7) % phrases.length];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = String(d.getFullYear()).slice(-2);
    let hour = d.getHours();
    const meridiem = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, "0");
    lines.push(`${month}/${day}/${year}, ${hour}:${min} ${meridiem} - ${sender}: ${phrase}`);
  }
  return lines.join("\n");
}
