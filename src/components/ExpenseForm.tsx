"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatVnd, toDateInputValue } from "@/lib/format";
import {
  buildCustomFromTotal,
  buildEqualFromTotal,
  splitFromTiers,
} from "@/lib/split";

type Person = { id: string; name: string };
type Group = {
  id: string;
  label: string;
  members: { personId: string; person: Person }[];
};
type Tier = { id: string; amount: number; label: string; isDefault: boolean };

type InputTab = "tier" | "total";

export function ExpenseForm() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [expenseDate, setExpenseDate] = useState(toDateInputValue(new Date()));
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tierAmounts, setTierAmounts] = useState<Record<string, number>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [inputTab, setInputTab] = useState<InputTab>("tier");
  const [totalInput, setTotalInput] = useState("");
  const [splitSubMode, setSplitSubMode] = useState<"equal" | "custom">("equal");
  const [headcount, setHeadcount] = useState("");
  const [defaultTierAmount, setDefaultTierAmount] = useState(50000);
  const [frequentGroupLabel, setFrequentGroupLabel] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/people").then((r) => r.json()),
      fetch("/api/frequent-groups").then((r) => r.json()),
      fetch("/api/price-tiers").then((r) => r.json()),
    ]).then(([p, g, t]) => {
      setPeople(p);
      setGroups(g);
      setTiers(t);
      const def = t.find((x: Tier) => x.isDefault) ?? t[0];
      if (def) setDefaultTierAmount(def.amount);
    });
  }, []);

  const selectedIds = useMemo(() => [...selected], [selected]);

  const preview = useMemo((): {
    total: number;
    amounts: Map<string, number>;
    error?: string;
  } | null => {
    if (selectedIds.length === 0) return null;

    if (inputTab === "tier") {
      const tierList = selectedIds.map((id) => ({
        personId: id,
        amount: tierAmounts[id] ?? defaultTierAmount,
      }));
      const built = splitFromTiers(tierList);
      return { total: built.total, amounts: built.amounts };
    }

    const total = parseInt(totalInput.replace(/\D/g, ""), 10) || 0;
    if (total <= 0) return { total: 0, amounts: new Map<string, number>(), error: "Nhập tổng tiền" };

    if (splitSubMode === "equal") {
      return buildEqualFromTotal(total, selectedIds);
    }

    const customList = selectedIds
      .filter((id) => customAmounts[id] > 0)
      .map((id) => ({ personId: id, amount: customAmounts[id] }));

    return buildCustomFromTotal(total, customList, selectedIds);
  }, [
    selectedIds,
    inputTab,
    tierAmounts,
    defaultTierAmount,
    totalInput,
    splitSubMode,
    customAmounts,
  ]);

  const togglePerson = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setTierAmounts((t) => {
          const copy = { ...t };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
        setTierAmounts((t) => ({ ...t, [id]: defaultTierAmount }));
      }
      return next;
    });
  };

  const applyGroup = (group: Group) => {
    const ids = new Set(group.members.map((m) => m.personId));
    setSelected(ids);
    setFrequentGroupLabel(group.label);
    const amounts: Record<string, number> = {};
    group.members.forEach((m) => {
      amounts[m.personId] = defaultTierAmount;
    });
    setTierAmounts(amounts);
  };

  const applyTierToAll = () => {
    const amounts: Record<string, number> = {};
    selectedIds.forEach((id) => {
      amounts[id] = defaultTierAmount;
    });
    setTierAmounts(amounts);
  };

  const applyHeadcount = () => {
    const n = parseInt(headcount, 10);
    if (n > 0 && selectedIds.length !== n) {
      setError(`Đã chọn ${selectedIds.length} người, bạn nhập ${n} — hãy chọn đủ hoặc sửa số người`);
    }
    applyTierToAll();
  };

  const setPersonTier = (personId: string, amount: number) => {
    setTierAmounts((t) => ({ ...t, [personId]: amount }));
  };

  const submit = async () => {
    setError("");
    if (selectedIds.length === 0) {
      setError("Chọn ít nhất một người");
      return;
    }
    if (preview?.error) {
      setError(preview.error);
      return;
    }

    setLoading(true);

    const payload: Record<string, unknown> = {
      expenseDate,
      description: description || "Chi tiêu",
      participantIds: selectedIds,
      frequentGroupLabel: frequentGroupLabel || undefined,
    };

    if (inputTab === "tier") {
      payload.splitMode = "tier";
      payload.tierAmounts = selectedIds.map((id) => ({
        personId: id,
        amount: tierAmounts[id] ?? defaultTierAmount,
      }));
    } else {
      payload.totalAmount = preview?.total;
      payload.splitMode = splitSubMode === "equal" ? "equal" : "custom";
      if (splitSubMode === "custom") {
        payload.customAmounts = selectedIds
          .filter((id) => customAmounts[id] > 0)
          .map((id) => ({ personId: id, amount: customAmounts[id] }));
      }
    }

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Lỗi lưu");
      setLoading(false);
      return;
    }

    const expense = await res.json();

    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_NETLIFY_FORM === "true") {
      const formData = new FormData();
      formData.append("form-name", "expense");
      formData.append("expense-date", expenseDate);
      formData.append("description", description || "Chi tiêu");
      formData.append("total-amount", String(expense.totalAmount));
      formData.append("split-mode", String(payload.splitMode));
      formData.append(
        "participants",
        selectedIds.map((id) => people.find((p) => p.id === id)?.name).join(",")
      );
      formData.append(
        "amounts-json",
        JSON.stringify(
          Object.fromEntries(
            selectedIds.map((id) => [
              people.find((p) => p.id === id)?.name,
              tierAmounts[id] ?? customAmounts[id],
            ])
          )
        )
      );
      if (frequentGroupLabel) formData.append("frequent-group", frequentGroupLabel);
      await fetch("/", { method: "POST", body: formData }).catch(() => {});
    }

    router.push(`/expenses/${expense.id}`);
    router.refresh();
  };

  const headcountPreview =
    parseInt(headcount, 10) > 0
      ? parseInt(headcount, 10) * defaultTierAmount
      : 0;

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div>
          <label className="label">Ngày</label>
          <input
            type="date"
            className="input"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Mô tả</label>
          <input
            className="input"
            placeholder="Cơm trưa, cafe..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="card space-y-3">
        <label className="label">Bộ người hay đi</label>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className="btn btn-secondary text-sm"
              onClick={() => applyGroup(g)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-[var(--border)] pt-3">
          <div className="w-24">
            <label className="label">Số người</label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="5"
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mức mặc định</label>
            <select
              className="input"
              value={defaultTierAmount}
              onChange={(e) => setDefaultTierAmount(Number(e.target.value))}
            >
              {tiers.map((t) => (
                <option key={t.id} value={t.amount}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {headcountPreview > 0 && (
            <p className="text-sm font-semibold">≈ {formatVnd(headcountPreview)}</p>
          )}
          <button type="button" className="btn btn-secondary text-sm" onClick={applyHeadcount}>
            Áp dụng mức cho đã chọn
          </button>
        </div>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Đã chọn: {selectedIds.length} người
        </p>
        <div className="flex flex-wrap gap-2">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`tier-btn ${selected.has(p.id) ? "active" : ""}`}
              onClick={() => togglePerson(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn flex-1 ${inputTab === "tier" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setInputTab("tier")}
          >
            Theo mức giá
          </button>
          <button
            type="button"
            className={`btn flex-1 ${inputTab === "total" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setInputTab("total")}
          >
            Theo tổng tiền
          </button>
        </div>

        {inputTab === "tier" && selectedIds.length > 0 && (
          <>
            <button type="button" className="btn btn-secondary w-full" onClick={applyTierToAll}>
              Áp dụng {defaultTierAmount / 1000}k cho tất cả
            </button>
            <ul className="space-y-3">
              {selectedIds.map((id) => {
                const person = people.find((p) => p.id === id);
                const current = tierAmounts[id] ?? defaultTierAmount;
                return (
                  <li key={id} className="border-b border-[var(--border)] pb-3 last:border-0">
                    <p className="mb-2 font-medium">{person?.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {tiers.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`tier-btn ${current === t.amount ? "active" : ""}`}
                          onClick={() => setPersonTier(id, t.amount)}
                        >
                          {t.label}
                        </button>
                      ))}
                      <input
                        className="input w-24 text-sm"
                        type="number"
                        step={1000}
                        placeholder="Khác"
                        value={current || ""}
                        onChange={(e) =>
                          setPersonTier(id, parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {inputTab === "total" && (
          <>
            <div>
              <label className="label">Tổng tiền (₫)</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="250000"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn flex-1 ${splitSubMode === "equal" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSplitSubMode("equal")}
              >
                Chia đều
              </button>
              <button
                type="button"
                className={`btn flex-1 ${splitSubMode === "custom" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSplitSubMode("custom")}
              >
                Ngoại lệ
              </button>
            </div>
            {splitSubMode === "custom" && selectedIds.length > 0 && (
              <ul className="space-y-2">
                {selectedIds.map((id) => {
                  const person = people.find((p) => p.id === id);
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <span className="w-24">{person?.name}</span>
                      <input
                        className="input flex-1"
                        type="number"
                        placeholder="Ngoại lệ (vd 55000)"
                        value={customAmounts[id] || ""}
                        onChange={(e) =>
                          setCustomAmounts((c) => ({
                            ...c,
                            [id]: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                      />
                    </li>
                  );
                })}
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Người không nhập sẽ chia phần còn lại đều
                </p>
              </ul>
            )}
          </>
        )}
      </div>

      {preview && selectedIds.length > 0 && (
        <div className="card">
          <h3 className="mb-2 font-semibold">Preview</h3>
          {preview.error && (
            <p className="mb-2 text-sm" style={{ color: "#ef4444" }}>
              {preview.error}
            </p>
          )}
          <ul className="mb-2 space-y-1 text-sm">
            {selectedIds.map((id) => {
              const person = people.find((p) => p.id === id);
              const amt = preview.amounts.get(id) ?? 0;
              return (
                <li key={id} className="flex justify-between">
                  <span>{person?.name}</span>
                  <span>{formatVnd(amt)}</span>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-[var(--border)] pt-2 font-bold">
            Tổng: {formatVnd(preview.total)}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={loading || !!preview?.error}
        onClick={submit}
      >
        {loading ? "Đang lưu..." : "Lưu chi tiêu"}
      </button>

      <form name="expense" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
        <input type="hidden" name="form-name" value="expense" />
        <input name="bot-field" />
        <input name="expense-date" />
        <input name="description" />
        <input name="total-amount" />
        <input name="split-mode" />
        <input name="participants" />
        <input name="amounts-json" />
        <input name="frequent-group" />
      </form>
    </div>
  );
}
