import { studyBlocks, WEEK_THEMES } from "./catalogs";
import type { StudyBlock, Weekday } from "./types";

export const STUDY_START = new Date(2026, 5, 8);
export const SUMMER_END = new Date(2026, 7, 28);

const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export function weekNumber(date = new Date()): number {
  const start = Date.UTC(STUDY_START.getFullYear(), STUDY_START.getMonth(), STUDY_START.getDate());
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor((target - start) / 86400000);
  if (days < 0) return 1;
  return Math.min(12, Math.max(1, Math.floor(days / 7) + 1));
}

export function weekdayFromDate(date = new Date()): Weekday | null {
  return WEEKDAYS[date.getDay() - 1] ?? null;
}

export function isSchoolYear(date = new Date()): boolean {
  const start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const end = Date.UTC(SUMMER_END.getFullYear(), SUMMER_END.getMonth(), SUMMER_END.getDate());
  return start > end;
}

export function seasonLabel(week: number, date = new Date()): string {
  if (isSchoolYear(date)) return "School year · Regional prep";
  return `Week ${week} · ${weekTheme(week)}`;
}

export function schoolYearFocus(date = new Date()): { subject: string; label: string; href: string } {
  switch (date.getDay()) {
    case 1:
      return { subject: "chemistry", label: "chemistry", href: "/practice/play?mode=subject&subject=chemistry" };
    case 2:
      return { subject: "biology", label: "biology", href: "/practice/play?mode=subject&subject=biology" };
    case 3:
      return { subject: "physics", label: "physics", href: "/practice/play?mode=subject&subject=physics" };
    case 4:
      return { subject: "earth", label: "Earth & Space", href: "/practice/play?mode=subject&subject=earth" };
    case 5:
      return { subject: "energy", label: "Energy", href: "/practice/play?mode=subject&subject=energy" };
    default:
      return { subject: "mixed", label: "mixed", href: "/practice/play?mode=tossup" };
  }
}

export function weekTheme(week: number): string {
  return WEEK_THEMES[week] ?? `Week ${week}`;
}

export function blocksForWeek(week: number): StudyBlock[] {
  return studyBlocks.filter((b) => b.week === week);
}

export function todayBlocks(week: number, date = new Date()): StudyBlock[] {
  const day = weekdayFromDate(date);
  if (!day) return [];
  return studyBlocks.filter((b) => b.week === week && b.day === day);
}

export function blockTime(day: Weekday, subject: string): string {
  const key = `${day}-${subject}`;
  const map: Record<string, string> = {
    "monday-chemistry": "10:00 – 11:00 AM",
    "tuesday-biology": "10:00 – 11:00 AM",
    "wednesday-physics": "3:00 – 4:00 PM",
    "thursday-chemistry": "11:00 AM – 12:00 PM",
    "friday-biology": "3:00 – 4:00 PM",
  };
  return map[key] ?? "1 hr block";
}

export function mathBlockTime(day: Weekday): string {
  const map: Record<Weekday, string> = {
    monday: "11:15 AM – 12:15 PM",
    tuesday: "11:15 AM – 12:15 PM",
    wednesday: "1:15 – 2:15 PM",
    thursday: "12:15 – 1:15 PM",
    friday: "4:00 – 5:00 PM",
  };
  return map[day];
}

export function subjectLabel(subject: string): string {
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

export function dayLabel(day: Weekday): string {
  return day.slice(0, 3).replace(/^./, (c) => c.toUpperCase());
}
