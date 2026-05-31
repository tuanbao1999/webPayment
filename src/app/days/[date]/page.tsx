import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseCard } from "@/components/ExpenseCard";
import { getExpensesForDate } from "@/lib/expense-service";
import { formatDateVi, formatVnd, parseDateInput } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date: dateStr } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) notFound();

  const date = parseDateInput(dateStr);
  const expenses = await getExpensesForDate(date);
  const totalSpent = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const totalUnpaid = expenses.reduce((s, e) => {
    const unpaid = e.splits
      .filter((sp) => !sp.settlement?.paidAt)
      .reduce((a, sp) => a + sp.amount, 0);
    return s + unpaid;
  }, 0);

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm">
        ← Hôm nay
      </Link>
      <h2 className="text-lg font-semibold">{formatDateVi(date)}</h2>
      <div className="card grid grid-cols-2 gap-4 text-center">
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
      <ul className="space-y-3">
        {expenses.map((e) => (
          <ExpenseCard key={e.id} expense={e} />
        ))}
      </ul>
      {expenses.length === 0 && (
        <p style={{ color: "var(--muted)" }}>Không có chi tiêu ngày này.</p>
      )}
    </div>
  );
}
