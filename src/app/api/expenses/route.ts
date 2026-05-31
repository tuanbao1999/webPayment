import { NextResponse } from "next/server";
import { createExpense } from "@/lib/expense-service";
import { parseDateInput } from "@/lib/format";
import type { SplitMode } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const date = dateStr ? parseDateInput(dateStr) : new Date();
    const { getExpensesForDate } = await import("@/lib/expense-service");
    const expenses = await getExpensesForDate(date);
    return NextResponse.json(expenses);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const expense = await createExpense({
      expenseDate: body.expenseDate,
      description: body.description,
      splitMode: body.splitMode as SplitMode,
      totalAmount: body.totalAmount,
      participantIds: body.participantIds,
      tierAmounts: body.tierAmounts,
      customAmounts: body.customAmounts,
      frequentGroupLabel: body.frequentGroupLabel,
      submissionId: body.submissionId,
    });
    return NextResponse.json(expense);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 400 }
    );
  }
}
