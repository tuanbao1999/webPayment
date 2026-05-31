import { NextResponse } from "next/server";
import { getExpenseById } from "@/lib/expense-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = await getExpenseById(id);
    if (!expense) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Xóa bill: xóa dòng trên sheet ChiTieu / ChiTiet trong Google Sheets" },
    { status: 501 }
  );
}
