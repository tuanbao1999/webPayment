"use client";

import { useEffect, useState } from "react";
import { formatVnd } from "@/lib/format";
import { DeleteButton } from "@/components/DeleteButton";

type Tier = { id: string; amount: number; label: string; isDefault: boolean };

export default function PriceTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/price-tiers")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTiers(data);
        else setError(data.error || "Lỗi");
      });

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(amount.replace(/\D/g, ""), 10);
    if (!n || n <= 0) return;
    setError("");
    const res = await fetch("/api/price-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: n,
        label: `${Math.round(n / 1000)}k`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Lỗi");
      return;
    }
    setAmount("");
    load();
  }

  async function remove(id: string) {
    setError("");
    const res = await fetch(`/api/price-tiers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không xóa được");
      throw new Error(data.error);
    }
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mức giá (40k, 45k, 50k…)</h2>
      {error && (
        <p className="text-sm" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
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
          <li key={t.id} className="flex items-center justify-between gap-2">
            <span>
              {t.label}
              {t.isDefault && (
                <span className="badge badge-paid ml-2">Mặc định</span>
              )}
              <span className="ml-2 text-sm" style={{ color: "var(--muted)" }}>
                {formatVnd(t.amount)}
              </span>
            </span>
            <DeleteButton label={t.label} onDelete={() => remove(t.id)} />
          </li>
        ))}
      </ul>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Sau khi sửa Apps Script, cần Deploy → New version trên Google để xóa hoạt động.
      </p>
    </div>
  );
}
