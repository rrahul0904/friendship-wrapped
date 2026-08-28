export function makeSampleChat() {
  const names = ["Maya", "Jordan"];
  const phrases = [
    "did you survive today 😂", "I have a story for you", "no way hahaha", "coffee tomorrow?", "you are ridiculous ❤️",
    "wait what happened??", "sending you the photo", "okay this is actually hilarious", "remember that trip?", "I knew you'd say that",
    "call me when you're free", "good luck today!!", "you've got this 💛", "we need to plan another weekend", "why are we like this 😂",
  ];
  const lines: string[] = [];
  let sessionStart = new Date(2023, 1, 3, 9, 10).getTime();

  for (let session = 0; session < 60; session++) {
    const sessionHour = [8, 11, 14, 18, 21, 23][session % 6];
    const base = new Date(sessionStart);
    base.setHours(sessionHour, (session * 7) % 50, 0, 0);

    for (let messageIndex = 0; messageIndex < 7; messageIndex++) {
      const offsetMinutes = messageIndex * (4 + (session % 5)) + (messageIndex % 3) * 2;
      const d = new Date(base.getTime() + offsetMinutes * 60 * 1000);
      const sender = names[(session + messageIndex) % 2];
      const phrase = phrases[(session * 3 + messageIndex * 5) % phrases.length];
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = String(d.getFullYear()).slice(-2);
      let hour = d.getHours();
      const meridiem = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      const min = String(d.getMinutes()).padStart(2, "0");
      lines.push(`${month}/${day}/${year}, ${hour}:${min} ${meridiem} - ${sender}: ${phrase}`);
    }

    sessionStart = base.getTime() + (18 + (session % 5) * 10) * 60 * 60 * 1000;
  }

  return lines.join("\n");
}
