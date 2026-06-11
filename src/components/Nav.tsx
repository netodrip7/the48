"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",          label: "Home"      },
  { href: "/indices",   label: "Indices"   },
  { href: "/crossword", label: "Crossword" },
  { href: "/editorial", label: "Editorial" },
  { href: "/matchday",  label: "Match Day" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">THE 48</Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link ${pathname === l.href ? "active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
