import Link from "next/link";
import { ExpenseFilter } from "@/components/ExpenseFilter";

export default function ExpensesListPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm">
          ← Hôm nay
        </Link>
        <h2 className="mt-2 text-lg font-semibold">Tìm & lọc bill</h2>
      </div>
      <ExpenseFilter />
    </div>
  );
}
