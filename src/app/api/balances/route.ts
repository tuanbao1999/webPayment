import { NextResponse } from "next/server";
import { getPersonBalances } from "@/lib/expense-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const balances = await getPersonBalances();
    return NextResponse.json(balances);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}
