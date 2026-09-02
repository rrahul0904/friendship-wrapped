"use client";

import { useRef, useState } from "react";
import type { MyYearMoment } from "@/products/myyear/model";

export function calendarMoments(text: string): MyYearMoment[] {
  const blocks = text.replace(/\r?\n[ \t]/g, "").split("BEGIN:VEVENT").slice(1);
  return blocks.slice(0, 250).map((block, index) => {
    const read = (name: string) => block.match(new RegExp(`^${name}(?:;[^:]*)?:(.+)$`, "mi"))?.[1]?.trim() ?? "";
    const rawDate = read("DTSTART");
    const date = /^\d{8}/.test(rawDate) ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : "";
    return { id: `ics-${index}-${crypto.randomUUID()}`, date, title: read("SUMMARY").slice(0, 120) || `Calendar event ${index + 1}`, caption: read("DESCRIPTION").slice(0, 240) || undefined, location: read("LOCATION").slice(0, 120) || undefined, photoCount: 0 };
  }).filter((moment) => Boolean(moment.date));
}

export function MyYearCalendarImport() {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  async function importCalendar(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) { setMessage("Choose a calendar file under 2 MB. It is read only in this browser."); return; }
    const moments = calendarMoments(await file.text());
    if (!moments.length) { setMessage("No VEVENT records were found in that .ics file."); return; }
    window.dispatchEvent(new CustomEvent<MyYearMoment[]>("threadtales:myyear-import", { detail: moments }));
    setMessage(`${moments.length} calendar entries were prepared locally for the selected MyYear.`);
  }
  return <section className="builder-card" aria-label="MyYear calendar import"><h3>Import a calendar</h3><p className="notice">Import an exported .ics file. Calendar data stays local, and only events that match the year selected above are added.</p><button className="btn btn-soft" onClick={() => input.current?.click()}>Choose .ics calendar</button><input ref={input} className="file-input" aria-label="Choose MyYear calendar" type="file" accept=".ics,text/calendar" onChange={(event) => void importCalendar(event.target.files?.[0])}/>{message ? <p className="notice" role="status">{message}</p> : null}</section>;
}
