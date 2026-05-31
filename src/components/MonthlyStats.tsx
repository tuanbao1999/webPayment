"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatVnd } from "@/lib/format";
import type { MonthlyStats } from "@/lib/expense-service";

export function MonthlyStatsView() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/stats?month=${month}`);
    const data = await res.json();
    setStats(res.ok ? data : null);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const maxCount = stats?.byPerson[0]?.count ?? 1;
  const maxAmount = stats?.topExpenses[0]?.amount ?? 1;

  return (
    <div className="space-y-6">
      <div className="card">
        <label className="label">Tháng</label>
        <input
          type="month"
          className="input"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Đang tải...</p>}

      {stats && !loading && (
        <>
          <section className="card grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Tổng chi tháng
              </p>
              <p className="text-2xl font-bold">{formatVnd(stats.totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Số bill
              </p>
              <p className="text-2xl font-bold">{stats.expenseCount}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Chưa thu trong tháng
              </p>
              <p className="text-lg font-semibold" style={{ color: "var(--warning)" }}>
                {formatVnd(stats.unpaidTotal)}
              </p>
            </div>
          </section>

          {stats.byPerson.length > 0 && (
            <section className="card">
              <h3 className="mb-3 font-semibold">Ai đi nhiều nhất</h3>
              <div className="bar-chart">
                {stats.byPerson.slice(0, 8).map((p) => (
                  <div key={p.name} className="bar-row">
                    <span className="truncate">{p.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(p.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-right">{p.count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {stats.topExpenses.length > 0 && (
            <section className="card">
              <h3 className="mb-3 font-semibold">Khoản chi lớn nhất</h3>
              <div className="bar-chart">
                {stats.topExpenses.map((e) => (
                  <div key={e.id} className="bar-row" style={{ gridTemplateColumns: "1fr auto" }}>
                    <Link href={`/expenses/${e.id}`} className="truncate text-sm">
                      {e.date} — {e.description}
                    </Link>
                    <span className="font-semibold">{formatVnd(e.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="bar-chart mt-3">
                {stats.topExpenses.map((e) => (
                  <div key={`bar-${e.id}`} className="bar-row">
                    <span className="truncate text-xs" style={{ color: "var(--muted)" }}>
                      {e.description.slice(0, 12)}
                    </span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(e.amount / maxAmount) * 100}%`,
                          background: "var(--warning)",
                        }}
                      />
                    </div>
                    <span />
                  </div>
                ))}
              </div>
            </section>
          )}

          {stats.expenseCount === 0 && (
            <p style={{ color: "var(--muted)" }}>Chưa có chi tiêu trong tháng này.</p>
          )}
        </>
      )}
    </div>
  );
}
