import type { StoryChapter, StoryEvent } from "@/platform/types";

export interface MyYearMoment {
  id: string;
  title: string;
  date: string;
  caption?: string;
  location?: string;
  photoCount: number;
}

export interface MyYearEra {
  id: string;
  label: string;
  startMonth: number;
  endMonth: number;
  moments: number;
}

export interface MyYearSummary {
  schemaVersion: 1;
  product: "myyear";
  year: number;
  title: string;
  moments: MyYearMoment[];
  monthlyCounts: Array<{ month: number; label: string; moments: number }>;
  eras: MyYearEra[];
  photoCount: number;
}

export interface MyYearShareManifest {
  version: 1;
  product: "myyear";
  year: number;
  title: string;
  momentCount: number;
  photoCount: number;
  activeMonths: string[];
  eras: Array<{ label: string; moments: number }>;
  attribution: true;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseMomentDate(date: string) {
  const value = new Date(`${date}T12:00:00`);
  if (!Number.isFinite(value.getTime())) throw new Error("Every MyYear moment needs a valid date.");
  return value;
}

export function buildMyYearSummary(year: number, title: string, moments: MyYearMoment[]): MyYearSummary {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error("Choose a valid year.");
  const cleanedTitle = title.trim() || `My ${year}`;
  const sorted = moments
    .map((moment) => ({ ...moment, title: moment.title.trim(), caption: moment.caption?.trim(), location: moment.location?.trim() }))
    .filter((moment) => moment.title)
    .sort((a, b) => parseMomentDate(a.date).getTime() - parseMomentDate(b.date).getTime());

  for (const moment of sorted) {
    if (parseMomentDate(moment.date).getFullYear() !== year) throw new Error(`Moment “${moment.title}” is outside ${year}.`);
  }

  const counts = Array.from({ length: 12 }, (_, month) => ({ month, label: MONTHS[month], moments: 0 }));
  for (const moment of sorted) counts[parseMomentDate(moment.date).getMonth()].moments += 1;

  const eras: MyYearEra[] = [];
  let start: number | null = null;
  let total = 0;
  for (let month = 0; month < 12; month += 1) {
    const count = counts[month].moments;
    if (count > 0) {
      if (start === null) start = month;
      total += count;
    }
    const nextActive = month < 11 && counts[month + 1].moments > 0;
    if (start !== null && (!nextActive || month === 11)) {
      eras.push({
        id: `era-${eras.length + 1}`,
        label: start === month ? MONTHS[start] : `${MONTHS[start]}–${MONTHS[month]}`,
        startMonth: start,
        endMonth: month,
        moments: total,
      });
      start = null;
      total = 0;
    }
  }

  return {
    schemaVersion: 1,
    product: "myyear",
    year,
    title: cleanedTitle,
    moments: sorted,
    monthlyCounts: counts,
    eras,
    photoCount: sorted.reduce((sum, moment) => sum + Math.max(0, moment.photoCount), 0),
  };
}

export function myYearEvents(summary: MyYearSummary): StoryEvent[] {
  return summary.moments.map((moment) => ({
    id: moment.id,
    product: "myyear",
    occurredAt: `${moment.date}T12:00:00.000Z`,
    type: "memory",
    title: moment.title,
    description: moment.caption,
    location: moment.location,
    metadata: { photoCount: moment.photoCount },
  }));
}

export function composeMyYearChapters(summary: MyYearSummary): StoryChapter[] {
  const activeMonths = summary.monthlyCounts.filter((item) => item.moments > 0);
  const busiest = [...summary.monthlyCounts].sort((a, b) => b.moments - a.moments)[0];
  const chapters: StoryChapter[] = [
    { id: "myyear-cover", type: "cover", title: summary.title, subtitle: `${summary.year} · your year in moments`, privacyLevel: "safe", renderVariant: "hero" },
    { id: "myyear-scale", type: "scale", title: "A year worth keeping", metric: summary.moments.length, subtitle: `${summary.photoCount} selected photos · ${activeMonths.length} active months`, privacyLevel: "safe", renderVariant: "metric" },
  ];

  if (busiest?.moments) chapters.push({ id: "myyear-busiest", type: "timeline", title: `${busiest.label} held the most memories`, metric: busiest.moments, subtitle: "saved moments", privacyLevel: "safe", renderVariant: "metric" });
  if (summary.eras.length) chapters.push({ id: "myyear-eras", type: "timeline", title: "Your year moved in eras", metric: summary.eras.length, supportingText: summary.eras.map((era) => `${era.label} · ${era.moments}`).join("  •  "), privacyLevel: "safe", renderVariant: "timeline" });

  for (const moment of summary.moments.slice(0, 4)) {
    chapters.push({ id: `myyear-${moment.id}`, type: "beginning", title: moment.title, subtitle: new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(parseMomentDate(moment.date)), supportingText: moment.location || undefined, privacyLevel: "sensitive", renderVariant: "hero" });
  }

  chapters.push({ id: "myyear-closing", type: "closing", title: `${summary.year}, kept.`, subtitle: "The ordinary days count too.", privacyLevel: "safe", renderVariant: "closing" });
  return chapters;
}

export function createMyYearShareManifest(summary: MyYearSummary): MyYearShareManifest {
  return {
    version: 1,
    product: "myyear",
    year: summary.year,
    title: summary.title,
    momentCount: summary.moments.length,
    photoCount: summary.photoCount,
    activeMonths: summary.monthlyCounts.filter((item) => item.moments > 0).map((item) => item.label),
    eras: summary.eras.map(({ label, moments }) => ({ label, moments })),
    attribution: true,
  };
}
