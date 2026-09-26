export const NAV = [
  { href: "/today", label: "Home", match: ["/today"] },
  { href: "/practice", label: "Practice", match: ["/practice", "/quiz"] },
  { href: "/learn", label: "Learn", match: ["/learn", "/topics", "/elements", "/weeks", "/calendar", "/mental-math"] },
  { href: "/progress", label: "Progress", match: ["/progress"] },
  { href: "/settings", label: "Settings", match: ["/settings"] },
] as const;

export function navActive(path: string, item: (typeof NAV)[number]) {
  return item.match.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
