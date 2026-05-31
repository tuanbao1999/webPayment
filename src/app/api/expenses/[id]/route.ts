import { NextResponse } from "next/server";
import { getExpenseById } from "@/lib/expense-service";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json(expense);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
