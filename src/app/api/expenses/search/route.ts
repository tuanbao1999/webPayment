import { NextRequest, NextResponse } from "next/server";
import { filterExpenses } from "@/lib/expense-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") as "all" | "paid" | "unpaid" | null;
    const data = await filterExpenses({
      dateFrom: sp.get("dateFrom") || undefined,
      dateTo: sp.get("dateTo") || undefined,
      personId: sp.get("personId") || undefined,
      status: status || "all",
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}
