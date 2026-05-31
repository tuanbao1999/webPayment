import { NextResponse } from "next/server";
import { toggleSettlement } from "@/lib/expense-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  try {
    const { splitId } = await params;
    const { paid } = await request.json();
    await toggleSettlement(splitId, !!paid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 400 }
    );
  }
}
