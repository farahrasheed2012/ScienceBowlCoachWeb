"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const store = useStore();
  return (
    <div className="shell" data-theme={store.appAppearance === "warmLight" ? "light" : "dark"}>
      <aside className="sidebar">
        <div className="brand">Science Bowl Coach</div>
        <nav className="nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={path.startsWith(item.href) ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
      <nav className="mobile-nav">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={path.startsWith(item.href) ? "active" : ""}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
