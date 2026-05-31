import { NextResponse } from "next/server";
import { toggleSettlement } from "@/lib/expense-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  const { splitId } = await params;
  const { paid } = await request.json();
  try {
    await toggleSettlement(splitId, !!paid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
