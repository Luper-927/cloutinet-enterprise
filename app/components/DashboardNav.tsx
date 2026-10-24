"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

export default function DashboardNav({
  links,
  orgName,
}: {
  links: NavLink[];
  orgName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Highlight only the most specific matching link
  const matches = links.filter(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/")
  );
  const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="bg-[#0A0E27] p-4 text-white md:min-h-screen md:w-60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-black">Cloutinet Enterprise</p>
          <p className="mt-1 truncate text-xs text-slate-400">{orgName}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="rounded-lg border border-white/20 px-3 py-2 text-sm md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div className={`${open ? "block" : "hidden"} md:block`}>
        <nav className="mt-6 space-y-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 hover:bg-white/10 ${
                l.href === activeHref ? "bg-white/10" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm text-slate-300 hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
