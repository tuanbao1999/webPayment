import { NextResponse } from "next/server";
import { createExpense, getExpensesForDate } from "@/lib/expense-service";
import { parseDateInput } from "@/lib/format";
import type { SplitMode } from "@/lib/split";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const date = dateStr ? parseDateInput(dateStr) : new Date();
  const expenses = await getExpensesForDate(date);
  return NextResponse.json(expenses);
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
    const message = e instanceof Error ? e.message : "Lỗi lưu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
