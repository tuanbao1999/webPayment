import { NextResponse } from "next/server";
import { sheetsRequest } from "@/lib/sheets-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await sheetsRequest("getFrequentGroups", {}, "GET");
    return NextResponse.json(groups);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { label, personIds } = await request.json();
    const group = await sheetsRequest("addFrequentGroup", { label, personIds });
    return NextResponse.json(group);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 400 }
    );
  }
}
