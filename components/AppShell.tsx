"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfileSwitch } from "@/components/ProfileSwitch";
import { ProgressSync } from "@/components/ProgressSync";
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
      <ProgressSync />
      <nav className="mobile-nav" aria-label="Primary">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={navActive(path, item) ? "active" : ""}>
            {item.short}
          </Link>
        ))}
      </nav>
      <aside className="sidebar">
        <div className="brand">Science Bowl Coach</div>
        <ProfileSwitch />
        <nav className="nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={navActive(path, item) ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={`main${path.startsWith("/periodic-table") ? " main-wide" : ""}`}>
        <div className="mobile-profile"><ProfileSwitch /></div>
        <div key={`${store.profileId}:${path}`} className="view-in">{children}</div>
      </main>
    </div>
  );
}
