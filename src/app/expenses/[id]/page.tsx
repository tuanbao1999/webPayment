import Link from "next/link";
import { notFound } from "next/navigation";
import { SettlementToggle } from "@/components/SettlementToggle";
import { getExpenseById } from "@/lib/expense-service";
import { formatDateVi, formatVnd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const paidCount = expense.splits.filter((s) => s.settlement?.paidAt).length;

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm">
        ← Về hôm nay
      </Link>
      <div className="card">
        <h2 className="text-lg font-semibold">{expense.description}</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {formatDateVi(new Date(expense.expenseDate))}
        </p>
        <p className="mt-2 text-2xl font-bold">{formatVnd(expense.totalAmount)}</p>
        <p className="mt-1 text-sm">
          {paidCount}/{expense.splits.length} đã chuyển khoản
        </p>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Tick đã nhận tiền</h3>
        {expense.splits.map((s) => (
          <SettlementToggle
            key={s.id}
            splitId={s.id}
            paid={!!s.settlement?.paidAt}
            personName={s.person.name}
            amount={s.amount}
          />
        ))}
      </div>
    </div>
  );
}
