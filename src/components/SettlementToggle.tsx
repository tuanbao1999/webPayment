"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettlementToggle({
  splitId,
  paid,
  personName,
  amount,
}: {
  splitId: string;
  paid: boolean;
  personName: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(paid);

  async function toggle() {
    setLoading(true);
    const next = !isPaid;
    const res = await fetch(`/api/settlements/${splitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: next }),
    });
    if (res.ok) {
      setIsPaid(next);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <label className="flex cursor-pointer items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={isPaid}
        disabled={loading}
        onChange={toggle}
        className="h-5 w-5 accent-[var(--accent)]"
      />
      <span className="flex-1">
        {personName}{" "}
        <span style={{ color: "var(--muted)" }}>
          ({amount.toLocaleString("vi-VN")}₫)
        </span>
      </span>
      <span className={`badge ${isPaid ? "badge-paid" : "badge-pending"}`}>
        {isPaid ? "Đã CK" : "Chưa"}
      </span>
    </label>
  );
}
