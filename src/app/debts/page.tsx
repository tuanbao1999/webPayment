import Link from "next/link";
import { getDebtsSummary } from "@/lib/expense-service";
import { formatVnd } from "@/lib/format";
import { SheetsSetupGuide } from "@/components/SheetsSetupGuide";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  if (!process.env.GOOGLE_SCRIPT_URL) {
    return <SheetsSetupGuide detail="Thiếu GOOGLE_SCRIPT_URL." />;
  }

  try {
    const { people, totalRemaining } = await getDebtsSummary();
    const withDebt = people.filter((p) => p.remaining > 0);

    return (
      <div className="space-y-6">
        <div>
          <Link href="/" className="text-sm">
            ← Hôm nay
          </Link>
          <h2 className="mt-2 text-lg font-semibold">Công nợ theo người</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Tổng hợp tất cả bill chưa tick CK
          </p>
        </div>

        <section className="card text-center">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Tổng chưa thu
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--warning)" }}>
            {formatVnd(totalRemaining)}
          </p>
        </section>

        {withDebt.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Không ai còn nợ — tuyệt!</p>
        ) : (
          <ul className="space-y-4">
            {withDebt.map((p) => (
              <li key={p.personId} className="card">
                <div className="mb-3 flex items-center justify-between">
                  <Link href={`/people/${p.personId}`} className="text-lg font-semibold">
                    {p.name}
                  </Link>
                  <span className="text-xl font-bold" style={{ color: "var(--warning)" }}>
                    {formatVnd(p.remaining)}
                  </span>
                </div>
                <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
                  Đã trả {formatVnd(p.totalPaid)} / {formatVnd(p.totalOwed)}
                </p>
                {p.unpaidItems.length > 0 && (
                  <ul className="space-y-1 border-t border-[var(--border)] pt-2 text-sm">
                    {p.unpaidItems.map((item) => (
                      <li key={item.splitId} className="flex justify-between gap-2">
                        <Link href={`/expenses/${item.expenseId}`} className="truncate">
                          {item.date} — {item.description || "Chi tiêu"}
                        </Link>
                        <span className="shrink-0">{formatVnd(item.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return <SheetsSetupGuide detail={message} />;
  }
}
