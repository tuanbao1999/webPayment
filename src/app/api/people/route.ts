import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nhập tên" }, { status: 400 });
  }
  const person = await prisma.person.create({
    data: { name: name.trim() },
  });
  return NextResponse.json(person);
}
