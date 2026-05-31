"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExpenseCard } from "@/components/ExpenseCard";
import { formatVnd } from "@/lib/format";

type Person = { id: string; name: string };

type Expense = {
  id: string;
  description: string;
  totalAmount: number;
  expenseDate: string;
  splits: {
    id: string;
    amount: number;
    person: { name: string };
    settlement: { paidAt: string | null } | null;
  }[];
};

export function ExpenseFilter() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [personId, setPersonId] = useState("");
  const [status, setStatus] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then(setPeople);
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (dateFrom) q.set("dateFrom", dateFrom);
    if (dateTo) q.set("dateTo", dateTo);
    if (personId) q.set("personId", personId);
    if (status !== "all") q.set("status", status);
    const res = await fetch(`/api/expenses/search?${q}`);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [dateFrom, dateTo, personId, status]);

  useEffect(() => {
    search();
  }, [search]);

  const total = expenses.reduce((s, e) => s + e.totalAmount, 0);

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Từ ngày</label>
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Đến ngày</label>
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Người</label>
          <select className="input" value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Tất cả</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Trạng thái CK</label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">Tất cả</option>
            <option value="unpaid">Còn người chưa CK</option>
            <option value="paid">Tất cả đã CK</option>
          </select>
        </div>
      </div>

      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {loading ? "Đang tải..." : `${expenses.length} bill — tổng ${formatVnd(total)}`}
      </p>

      {expenses.length === 0 && !loading ? (
        <p style={{ color: "var(--muted)" }}>Không có bill phù hợp bộ lọc.</p>
      ) : (
        <ul className="space-y-3">
          {expenses.map((e) => (
            <div key={e.id}>
              <p className="mb-1 text-xs" style={{ color: "var(--muted)" }}>
                {e.expenseDate?.toString().slice(0, 10)}
              </p>
              <ExpenseCard expense={e} />
            </div>
          ))}
        </ul>
      )}

      <Link href="/expenses/new" className="btn btn-primary block w-full text-center">
        + Thêm chi tiêu
      </Link>
    </div>
  );
}
