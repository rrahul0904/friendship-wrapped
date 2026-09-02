import { describe, expect, it } from "vitest";
import { calendarMoments } from "@/components/MyYearCalendarImport";

describe("MyYear calendar import", () => {
  it("converts local iCalendar events into deterministic MyYear moments", () => {
    const moments = calendarMoments("BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20260314\nSUMMARY:Spring walk\nDESCRIPTION:A private note\nLOCATION:Park\nEND:VEVENT\nEND:VCALENDAR");
    expect(moments).toMatchObject([{ date: "2026-03-14", title: "Spring walk", caption: "A private note", location: "Park", photoCount: 0 }]);
  });

  it("rejects calendar entries without a valid all-day date", () => {
    expect(calendarMoments("BEGIN:VEVENT\nSUMMARY:Missing date\nEND:VEVENT")).toEqual([]);
  });
});
