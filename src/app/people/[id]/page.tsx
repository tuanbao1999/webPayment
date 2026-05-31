import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonHistory } from "@/lib/expense-service";
import { formatDateVi, formatVnd } from "@/lib/format";
import { SheetsSetupGuide } from "@/components/SheetsSetupGuide";

export const dynamic = "force-dynamic";

export default async function PersonHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!process.env.GOOGLE_SCRIPT_URL) {
    return <SheetsSetupGuide detail="Thiếu GOOGLE_SCRIPT_URL." />;
  }

  const { id } = await params;

  try {
    const data = await getPersonHistory(id);
    if (!data.items.length && !data.person.name) notFound();

    return (
      <div className="space-y-6">
        <div>
          <Link href="/people" className="text-sm">
            ← Danh bạ
          </Link>
          <h2 className="mt-2 text-lg font-semibold">{data.person.name}</h2>
        </div>

        <section className="card grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p style={{ color: "var(--muted)" }}>Tổng tham gia</p>
            <p className="font-bold">{formatVnd(data.totalOwed)}</p>
          </div>
          <div>
            <p style={{ color: "var(--muted)" }}>Đã CK</p>
            <p className="font-bold" style={{ color: "var(--success)" }}>
              {formatVnd(data.totalPaid)}
            </p>
          </div>
          <div>
            <p style={{ color: "var(--muted)" }}>Còn nợ</p>
            <p className="font-bold" style={{ color: "var(--warning)" }}>
              {formatVnd(data.remaining)}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Lịch sử bill ({data.items.length})</h3>
          {data.items.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Chưa tham gia bill nào.</p>
          ) : (
            <ul className="space-y-2">
              {data.items.map((item) => (
                <li key={item.splitId} className="card flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {item.expense ? (
                      <Link href={`/expenses/${item.expense.id}`} className="font-medium">
                        {item.expense.description}
                      </Link>
                    ) : (
                      <span>Bill đã xóa</span>
                    )}
                    {item.expense && (
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {formatDateVi(new Date(item.expense.expenseDate))}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatVnd(item.amount)}</p>
                    <span className={`badge ${item.paid ? "badge-paid" : "badge-pending"}`}>
                      {item.paid ? "Đã CK" : "Chưa CK"}
                    </span>
                  </div>
                </li>
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
