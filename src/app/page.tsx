import Link from "next/link";
import { getExpensesForDate, getPersonBalances } from "@/lib/expense-service";
import { formatDateVi, formatVnd, toDateInputValue } from "@/lib/format";
import { ExpenseCard } from "@/components/ExpenseCard";
import { SheetsSetupGuide } from "@/components/SheetsSetupGuide";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!process.env.GOOGLE_SCRIPT_URL) {
    return <SheetsSetupGuide detail="Thiếu GOOGLE_SCRIPT_URL trên server." />;
  }

  try {
    const today = new Date();
    const expenses = await getExpensesForDate(today);
    const balances = await getPersonBalances();

    const totalSpent = expenses.reduce((s, e) => s + e.totalAmount, 0);
    const totalUnpaid = expenses.reduce((s, e) => {
      const unpaid = e.splits
        .filter((sp) => !sp.settlement?.paidAt)
        .reduce((a, sp) => a + sp.amount, 0);
      return s + unpaid;
    }, 0);

    const dateStr = toDateInputValue(today);
    const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

    return (
      <div className="space-y-6">
        {sheetUrl && (
          <p className="text-sm">
            <a href={sheetUrl} target="_blank" rel="noreferrer">
              Mở Google Sheet →
            </a>
          </p>
        )}
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Hôm nay — {formatDateVi(today)}</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Đã chi
              </p>
              <p className="text-xl font-bold">{formatVnd(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Chưa thu
              </p>
              <p className="text-xl font-bold" style={{ color: "var(--warning)" }}>
                {formatVnd(totalUnpaid)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/expenses/new" className="btn btn-primary flex-1 text-center">
              + Thêm chi tiêu
            </Link>
            <Link href={`/days/${dateStr}`} className="btn btn-secondary">
              Xem ngày
            </Link>
          </div>
        </section>

        {balances.length > 0 && (
          <section className="card">
            <h2 className="mb-3 text-lg font-semibold">Ai còn nợ (tất cả)</h2>
            <ul className="space-y-2">
              {balances.map((b) => (
                <li
                  key={b.personId}
                  className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0"
                >
                  <span>{b.name}</span>
                  <span className="font-semibold" style={{ color: "var(--warning)" }}>
                    {formatVnd(b.remaining)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Bill hôm nay ({expenses.length})</h2>
          {expenses.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Chưa có chi tiêu. Thêm bill đầu tiên!</p>
          ) : (
            <ul className="space-y-3">
              {expenses.map((e) => (
                <ExpenseCard key={e.id} expense={e} />
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return <SheetsSetupGuide detail={message} />;
  }
}
