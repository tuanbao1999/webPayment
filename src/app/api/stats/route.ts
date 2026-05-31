import { NextRequest, NextResponse } from "next/server";
import { getMonthlyStats } from "@/lib/expense-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const month =
      request.nextUrl.searchParams.get("month") ||
      new Date().toISOString().slice(0, 7);
    const data = await getMonthlyStats(month);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}
