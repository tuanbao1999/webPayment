import { ExpenseForm } from "@/components/ExpenseForm";
import { ensureSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  await ensureSeed();
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Thêm chi tiêu</h2>
      <ExpenseForm />
    </div>
  );
}
