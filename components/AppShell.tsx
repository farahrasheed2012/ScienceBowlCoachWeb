"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV, navActive } from "@/lib/nav";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const store = useStore();
  const [systemLight, setSystemLight] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => setSystemLight(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const light = store.appAppearance === "warmLight" || (store.appAppearance === "system" && systemLight);
  return (
    <div className="shell" data-theme={light ? "light" : "dark"}>
      <aside className="sidebar">
        <div className="brand">Science Bowl Coach</div>
        <nav className="nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={navActive(path, item) ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">
        <div key={path} className="view-in">{children}</div>
      </main>
      <nav className="mobile-nav">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={navActive(path, item) ? "active" : ""}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
