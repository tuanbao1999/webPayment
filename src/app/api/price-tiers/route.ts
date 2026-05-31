import { NextResponse } from "next/server";
import { sheetsRequest } from "@/lib/sheets-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tiers = await sheetsRequest("getPriceTiers", {}, "GET");
    return NextResponse.json(tiers);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { amount, label, isDefault } = await request.json();
    const tier = await sheetsRequest("addPriceTier", { amount, label, isDefault });
    return NextResponse.json(tier);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 400 }
    );
  }
}
