export const NAV = [
  { href: "/today", label: "Home", short: "Home", match: ["/today"] },
  { href: "/practice", label: "Practice", short: "Practice", match: ["/practice", "/quiz"] },
  { href: "/learn", label: "Learn", short: "Learn", match: ["/learn", "/topics", "/elements", "/weeks", "/calendar", "/mental-math"] },
  { href: "/periodic-table", label: "Periodic Table", short: "Table", match: ["/periodic-table"] },
  { href: "/python", label: "Python", short: "Python", match: ["/python"] },
  { href: "/progress", label: "Progress", short: "Progress", match: ["/progress"] },
  { href: "/settings", label: "Settings", short: "Settings", match: ["/settings", "/quiz/buzzer", "/buzzer"] },
] as const;

export function navActive(path: string, item: (typeof NAV)[number]) {
  return item.match.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
