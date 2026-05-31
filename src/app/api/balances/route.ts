import { NextResponse } from "next/server";
import { getPersonBalances } from "@/lib/expense-service";

export async function GET() {
  const balances = await getPersonBalances();
  return NextResponse.json(balances);
}
