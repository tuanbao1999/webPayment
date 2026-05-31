import { NextResponse } from "next/server";
import { sheetsRequest } from "@/lib/sheets-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const people = await sheetsRequest<{ id: string; name: string; active: boolean }[]>(
      "getPeople",
      {},
      "GET"
    );
    return NextResponse.json(people);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const person = await sheetsRequest("addPerson", { name });
    return NextResponse.json(person);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 400 }
    );
  }
}
