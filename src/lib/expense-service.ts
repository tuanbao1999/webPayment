import {
  buildCustomFromTotal,
  buildEqualFromTotal,
  splitFromTiers,
  type SplitMode,
} from "@/lib/split";
import { sheetsRequest } from "@/lib/sheets-api";

export type ExpenseWithSplits = {
  id: string;
  expenseDate: string | Date;
  description: string;
  totalAmount: number;
  splitMode: string;
  splits: {
    id: string;
    amount: number;
    person: { name: string };
    settlement: { paidAt: Date | string | null } | null;
  }[];
  createdAt?: string;
};

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
  if (participantIds.length === 0) throw new Error("Chọn ít nhất một người");

  let totalAmount = payload.totalAmount ?? 0;
  let amounts: Map<string, number>;
  let splitMode = payload.splitMode;

  if (splitMode === "tier" && payload.tierAmounts) {
    const built = splitFromTiers(payload.tierAmounts);
    totalAmount = built.total;
    amounts = built.amounts;
  } else if (splitMode === "equal" || splitMode === "from_total") {
    if (!payload.totalAmount || payload.totalAmount <= 0) throw new Error("Nhập tổng tiền hợp lệ");
    const built = buildEqualFromTotal(payload.totalAmount, participantIds);
    totalAmount = built.total;
    amounts = built.amounts;
    splitMode = "equal";
  } else if (splitMode === "custom") {
    if (!payload.totalAmount || payload.totalAmount <= 0) throw new Error("Nhập tổng tiền hợp lệ");
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

  const tierAmounts = participantIds.map((personId) => ({
    personId,
    amount: amounts.get(personId)!,
  }));

  return sheetsRequest<ExpenseWithSplits>("createExpense", {
    expenseDate: payload.expenseDate,
    description: payload.description || "Chi tiêu",
    splitMode,
    totalAmount,
    participantIds,
    tierAmounts,
    frequentGroupLabel: payload.frequentGroupLabel,
    submissionId: payload.submissionId,
  });
}

export async function getExpensesForDate(date: Date) {
  const dateStr = date.toISOString().slice(0, 10);
  return sheetsRequest<ExpenseWithSplits[]>(
    "getExpensesByDate",
    { date: dateStr },
    "GET"
  );
}

export async function getExpenseById(id: string) {
  return sheetsRequest<ExpenseWithSplits | null>("getExpense", { id }, "GET");
}

export async function toggleSettlement(splitId: string, paid: boolean) {
  return sheetsRequest("togglePaid", { splitId, paid });
}

export async function getPersonBalances() {
  return sheetsRequest<
    { personId: string; name: string; owed: number; paid: number; remaining: number }[]
  >("getBalances", {}, "GET");
}
