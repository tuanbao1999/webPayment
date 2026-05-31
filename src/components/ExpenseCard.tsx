import Link from "next/link";
import { formatVnd } from "@/lib/format";

type Split = {
  id: string;
  amount: number;
  person: { name: string };
  settlement: { paidAt: Date | string | null } | null;
};

type Expense = {
  id: string;
  description: string;
  totalAmount: number;
  splits: Split[];
};

export function ExpenseCard({ expense }: { expense: Expense }) {
  const paidCount = expense.splits.filter((s) => s.settlement?.paidAt).length;
  const total = expense.splits.length;

  return (
    <li className="card">
      <Link href={`/expenses/${expense.id}`} className="block no-underline hover:no-underline">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-[var(--text)]">{expense.description}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {paidCount}/{total} đã CK
            </p>
          </div>
          <p className="font-bold">{formatVnd(expense.totalAmount)}</p>
        </div>
      </Link>
    </li>
  );
}
