import { prisma } from "@/lib/db";
import {
  buildCustomFromTotal,
  buildEqualFromTotal,
  splitFromTiers,
  type SplitMode,
} from "@/lib/split";
import { endOfDay, parseDateInput, startOfDay } from "@/lib/format";

export type CreateExpensePayload = {
  expenseDate: string;
  description: string;
  splitMode: SplitMode;
  totalAmount?: number;
  participantIds: string[];
  tierAmounts?: { personId: string; amount: number }[];
  customAmounts?: { personId: string; amount: number }[];
  frequentGroupLabel?: string;
  submissionId?: string;
};

export async function createExpense(payload: CreateExpensePayload) {
  const { participantIds } = payload;
  if (participantIds.length === 0) {
    throw new Error("Chọn ít nhất một người");
  }

  let totalAmount = payload.totalAmount ?? 0;
  let amounts: Map<string, number>;
  let splitMode = payload.splitMode;

  if (splitMode === "tier" && payload.tierAmounts) {
    const built = splitFromTiers(payload.tierAmounts);
    totalAmount = built.total;
    amounts = built.amounts;
  } else if (splitMode === "equal" || splitMode === "from_total") {
    if (!payload.totalAmount || payload.totalAmount <= 0) {
      throw new Error("Nhập tổng tiền hợp lệ");
    }
    const built = buildEqualFromTotal(payload.totalAmount, participantIds);
    totalAmount = built.total;
    amounts = built.amounts;
    splitMode = "equal";
  } else if (splitMode === "custom") {
    if (!payload.totalAmount || payload.totalAmount <= 0) {
      throw new Error("Nhập tổng tiền hợp lệ");
    }
    const built = buildCustomFromTotal(
      payload.totalAmount,
      payload.customAmounts ?? [],
      participantIds
    );
    if (built.error) throw new Error(built.error);
    totalAmount = built.total;
    amounts = built.amounts;
  } else {
    throw new Error("Chế độ chia không hợp lệ");
  }

  for (const id of participantIds) {
    const amt = amounts.get(id);
    if (!amt || amt <= 0) throw new Error("Mỗi người phải có số tiền > 0");
  }

  if (payload.submissionId) {
    const existing = await prisma.expense.findUnique({
      where: { submissionId: payload.submissionId },
    });
    if (existing) return existing;
  }

  const expense = await prisma.expense.create({
    data: {
      expenseDate: parseDateInput(payload.expenseDate),
      description: payload.description || "Chi tiêu",
      totalAmount,
      splitMode,
      frequentGroupLabel: payload.frequentGroupLabel,
      submissionId: payload.submissionId,
      splits: {
        create: participantIds.map((personId) => ({
          personId,
          amount: amounts.get(personId)!,
          isManual: splitMode === "custom" || splitMode === "tier",
          settlement: { create: {} },
        })),
      },
    },
    include: {
      splits: { include: { person: true, settlement: true } },
    },
  });

  return expense;
}

export async function getExpensesForDate(date: Date) {
  return prisma.expense.findMany({
    where: {
      expenseDate: { gte: startOfDay(date), lte: endOfDay(date) },
    },
    include: {
      splits: { include: { person: true, settlement: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExpenseById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      splits: { include: { person: true, settlement: true } },
    },
  });
}

export async function toggleSettlement(splitId: string, paid: boolean) {
  const split = await prisma.expenseSplit.findUnique({
    where: { id: splitId },
    include: { settlement: true },
  });
  if (!split?.settlement) throw new Error("Không tìm thấy");

  return prisma.settlement.update({
    where: { id: split.settlement.id },
    data: { paidAt: paid ? new Date() : null },
  });
}

export async function getPersonBalances() {
  const splits = await prisma.expenseSplit.findMany({
    include: { person: true, settlement: true },
  });

  const map = new Map<
    string,
    { personId: string; name: string; owed: number; paid: number }
  >();

  for (const s of splits) {
    const cur = map.get(s.personId) ?? {
      personId: s.personId,
      name: s.person.name,
      owed: 0,
      paid: 0,
    };
    cur.owed += s.amount;
    if (s.settlement?.paidAt) cur.paid += s.amount;
    map.set(s.personId, cur);
  }

  return [...map.values()]
    .map((p) => ({ ...p, remaining: p.owed - p.paid }))
    .filter((p) => p.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining);
}
