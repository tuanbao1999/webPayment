import Link from "next/link";
import { MonthlyStatsView } from "@/components/MonthlyStats";

export default function StatsPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm">
          ← Hôm nay
        </Link>
        <h2 className="mt-2 text-lg font-semibold">Thống kê tháng</h2>
      </div>
      <MonthlyStatsView />
    </div>
  );
}
