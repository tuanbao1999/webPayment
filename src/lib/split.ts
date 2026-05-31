export type SplitMode = "tier" | "equal" | "custom" | "from_total";

export type SplitInput = {
  personId: string;
  amount?: number;
};

export function splitEqual(totalAmount: number, participantIds: string[]): Map<string, number> {
  const result = new Map<string, number>();
  if (participantIds.length === 0) return result;

  const base = Math.floor(totalAmount / participantIds.length);
  let remainder = totalAmount - base * participantIds.length;

  participantIds.forEach((id, index) => {
    const extra = remainder > 0 ? 1 : 0;
    if (extra) remainder -= 1;
    result.set(id, base + extra);
  });

  return result;
}

export function splitFromTiers(
  participantAmounts: { personId: string; amount: number }[]
): { total: number; amounts: Map<string, number> } {
  const amounts = new Map<string, number>();
  let total = 0;
  for (const { personId, amount } of participantAmounts) {
    amounts.set(personId, amount);
    total += amount;
  }
  return { total, amounts };
}

export function validateSplits(
  totalAmount: number,
  amounts: Map<string, number>
): { ok: boolean; diff: number } {
  const sum = [...amounts.values()].reduce((a, b) => a + b, 0);
  const diff = totalAmount - sum;
  return { ok: diff === 0, diff };
}

export function buildEqualFromTotal(
  totalAmount: number,
  participantIds: string[]
): { total: number; amounts: Map<string, number> } {
  const amounts = splitEqual(totalAmount, participantIds);
  return { total: totalAmount, amounts };
}

export function buildCustomFromTotal(
  totalAmount: number,
  customAmounts: { personId: string; amount: number }[],
  allParticipantIds: string[]
): { total: number; amounts: Map<string, number>; error?: string } {
  const amounts = new Map<string, number>();
  const manualIds = new Set(customAmounts.filter((c) => c.amount > 0).map((c) => c.personId));
  const manualSum = customAmounts.reduce((s, c) => s + (c.amount || 0), 0);
  const restIds = allParticipantIds.filter((id) => !manualIds.has(id));

  for (const c of customAmounts) {
    if (c.amount > 0) amounts.set(c.personId, c.amount);
  }

  const remaining = totalAmount - manualSum;
  if (restIds.length > 0) {
    if (remaining < 0) {
      return { total: totalAmount, amounts, error: "Tổng ngoại lệ vượt quá bill" };
    }
    const restSplit = splitEqual(remaining, restIds);
    restSplit.forEach((v, k) => amounts.set(k, v));
  }

  const { ok, diff } = validateSplits(totalAmount, amounts);
  if (!ok) {
    return {
      total: totalAmount,
      amounts,
      error: diff > 0 ? `Còn thiếu ${diff.toLocaleString("vi-VN")}₫` : `Thừa ${Math.abs(diff).toLocaleString("vi-VN")}₫`,
    };
  }

  return { total: totalAmount, amounts };
}
