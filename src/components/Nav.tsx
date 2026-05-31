"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Hôm nay" },
  { href: "/expenses/new", label: "Thêm chi tiêu" },
  { href: "/people", label: "Danh bạ" },
  { href: "/frequent-groups", label: "Bộ hay đi" },
  { href: "/settings/price-tiers", label: "Mức giá" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={pathname === l.href ? "active" : ""}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
