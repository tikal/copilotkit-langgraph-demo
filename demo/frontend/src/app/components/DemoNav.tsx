"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const patterns = [
  { href: "/pattern1", label: "Pattern 1", desc: "Direct AG-UI" },
  { href: "/pattern2", label: "Pattern 2", desc: "Next.js Proxy" },
  { href: "/pattern3", label: "Pattern 3", desc: "State Streaming" },
];

export function DemoNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 p-3 bg-gray-100 border-b">
      {patterns.map(({ href, label, desc }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-2 rounded text-sm ${
            pathname.startsWith(href)
              ? "bg-blue-600 text-white"
              : "bg-white hover:bg-gray-200 text-gray-700 border"
          }`}
        >
          <span className="font-medium">{label}</span>
          <span className="opacity-70 ml-1">({desc})</span>
        </Link>
      ))}
    </nav>
  );
}
