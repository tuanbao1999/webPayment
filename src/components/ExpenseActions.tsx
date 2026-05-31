"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatVnd } from "@/lib/format";

type Split = {
  id: string;
  amount: number;
  person: { id?: string; name: string };
};

type Props = {
  expenseId: string;
  expenseDate: string;
  description: string;
  splits: Split[];
};

export function ExpenseActions({ expenseId, expenseDate, description, splits }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(expenseDate.slice(0, 10));
  const [desc, setDesc] = useState(description);
  const [amounts, setAmounts] = useState<Record<string, number>>(
    Object.fromEntries(splits.map((s) => [s.person.id || s.id, s.amount]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const participantIds = splits.map((s) => s.person.id || "").filter(Boolean);

  const save = async () => {
    setError("");
    setLoading(true);
    const tierAmounts = splits.map((s) => ({
      personId: s.person.id || "",
      amount: amounts[s.person.id || s.id] ?? s.amount,
    }));
    const totalAmount = tierAmounts.reduce((a, t) => a + t.amount, 0);

    const res = await fetch(`/api/expenses/${expenseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expenseDate: date,
        description: desc,
        splitMode: "tier",
        participantIds,
        tierAmounts,
        totalAmount,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Lỗi lưu");
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Xóa bill này? Không hoàn tác được.")) return;
    setLoading(true);
    const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Không xóa được");
      return;
    }
    router.push("/expenses");
    router.refresh();
  };

  if (!editing) {
    return (
      <div className="card flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary flex-1" onClick={() => setEditing(true)}>
          Sửa bill
        </button>
        <button
          type="button"
          className="btn btn-secondary flex-1"
          style={{ color: "#f87171", borderColor: "#7f1d1d" }}
          onClick={remove}
          disabled={loading}
        >
          Xóa bill
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold">Sửa bill</h3>
      <div>
        <label className="label">Ngày</label>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Mô tả</label>
        <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <ul className="space-y-2">
        {splits.map((s) => {
          const key = s.person.id || s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span className="w-28">{s.person.name}</span>
              <input
                className="input flex-1"
                type="number"
                value={amounts[key] ?? ""}
                onChange={(e) =>
                  setAmounts((a) => ({
                    ...a,
                    [key]: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </li>
          );
        })}
      </ul>
      <p className="text-sm font-semibold">
        Tổng:{" "}
        {formatVnd(
          splits.reduce((sum, s) => sum + (amounts[s.person.id || s.id] ?? s.amount), 0)
        )}
      </p>
      {error && (
        <p className="text-sm" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={save} disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setEditing(false)}
          disabled={loading}
        >
          Hủy
        </button>
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Lưu ý: sửa bill sẽ reset trạng thái CK của tất cả người trong bill.
      </p>
    </div>
  );
}
