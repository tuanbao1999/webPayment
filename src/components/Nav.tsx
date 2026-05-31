"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Hôm nay" },
  { href: "/expenses/new", label: "Thêm" },
  { href: "/debts", label: "Công nợ" },
  { href: "/expenses", label: "Lọc bill" },
  { href: "/stats", label: "Thống kê" },
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
          className={
            pathname === l.href ||
            (l.href === "/people" && pathname.startsWith("/people/")) ||
            (l.href === "/debts" && pathname.startsWith("/debts"))
              ? "active"
              : ""
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
