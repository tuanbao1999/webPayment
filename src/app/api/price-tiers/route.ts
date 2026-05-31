import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const tiers = await prisma.priceTier.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(tiers);
}

export async function POST(request: Request) {
  const { amount, label, isDefault } = await request.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
  }
  const count = await prisma.priceTier.count();
  if (isDefault) {
    await prisma.priceTier.updateMany({ data: { isDefault: false } });
  }
  const tier = await prisma.priceTier.create({
    data: {
      amount: Number(amount),
      label: label || `${Math.round(amount / 1000)}k`,
      sortOrder: count,
      isDefault: !!isDefault,
    },
  });
  return NextResponse.json(tier);
}
