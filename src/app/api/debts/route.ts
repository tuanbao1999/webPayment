import { NextResponse } from "next/server";
import { getDebtsSummary } from "@/lib/expense-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDebtsSummary();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}
