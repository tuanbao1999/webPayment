"use client";

import { useEffect, useState } from "react";
import { formatVnd } from "@/lib/format";

type Tier = { id: string; amount: number; label: string; isDefault: boolean };

export default function PriceTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [amount, setAmount] = useState("");

  const load = () => fetch("/api/price-tiers").then((r) => r.json()).then(setTiers);

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(amount.replace(/\D/g, ""), 10);
    if (!n || n <= 0) return;
    await fetch("/api/price-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: n,
        label: `${Math.round(n / 1000)}k`,
      }),
    });
    setAmount("");
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mức giá (40k, 45k, 50k…)</h2>
      <form onSubmit={add} className="card flex gap-2">
        <input
          className="input flex-1"
          placeholder="Số tiền (vd 60000)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Thêm mức
        </button>
      </form>
      <ul className="card space-y-2">
        {tiers.map((t) => (
          <li key={t.id} className="flex justify-between">
            <span>
              {t.label}
              {t.isDefault && (
                <span className="badge badge-paid ml-2">Mặc định</span>
              )}
            </span>
            <span>{formatVnd(t.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
