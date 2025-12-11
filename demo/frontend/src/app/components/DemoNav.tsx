"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const patterns = [
  {
    id: "pattern1",
    label: "Pattern 1",
    desc: "Direct AG-UI",
    baseHref: "/pattern1",
    routes: [
      { href: "/pattern1", label: "Chat" },
      { href: "/pattern1/state", label: "State" },
      { href: "/pattern1/threads", label: "Threads" },
    ],
  },
  {
    id: "pattern2",
    label: "Pattern 2",
    desc: "Next.js Proxy",
    baseHref: "/pattern2",
    routes: [
      { href: "/pattern2", label: "Chat" },
      { href: "/pattern2/state", label: "State" },
      { href: "/pattern2/threads", label: "Threads" },
    ],
  },
  {
    id: "pattern3",
    label: "Pattern 3",
    desc: "Direct Python",
    baseHref: "/pattern3",
    routes: [
      { href: "/pattern3", label: "Chat" },
      { href: "/pattern3/state", label: "State" },
      { href: "/pattern3/threads", label: "Threads" },
    ],
  },
];

export function DemoNav() {
  const pathname = usePathname();

  const isPatternActive = (baseHref: string) => pathname.startsWith(baseHref);

  return (
    <nav className="flex gap-4 p-4 bg-gray-100 border-b overflow-x-auto">
      {patterns.map((pattern) => (
        <div key={pattern.id} className="flex flex-col gap-1">
          <div
            className={`text-xs font-semibold px-2 py-1 rounded ${
              isPatternActive(pattern.baseHref)
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600"
            }`}
          >
            {pattern.label}{" "}
            <span className="font-normal opacity-70">({pattern.desc})</span>
          </div>
          <div className="flex gap-1">
            {pattern.routes.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                  pathname === href
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-200 text-gray-700"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
