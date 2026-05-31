import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const groups = await prisma.frequentGroup.findMany({
    include: {
      members: { include: { person: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const { label, personIds } = await request.json();
  if (!label?.trim() || !personIds?.length) {
    return NextResponse.json({ error: "Nhập tên bộ và chọn người" }, { status: 400 });
  }
  const group = await prisma.frequentGroup.create({
    data: {
      label: label.trim(),
      members: {
        create: personIds.map((personId: string) => ({ personId })),
      },
    },
    include: { members: { include: { person: true } } },
  });
  return NextResponse.json(group);
}
