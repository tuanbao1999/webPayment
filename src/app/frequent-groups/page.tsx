"use client";

import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";

type Person = { id: string; name: string };
type Group = {
  id: string;
  label: string;
  members: { personId: string; person: Person }[];
};

export default function FrequentGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/frequent-groups")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGroups(data);
        else setError(data.error || "Lỗi");
      });
    fetch("/api/people")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPeople(data);
      });
  };

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || selected.size === 0) return;
    setError("");
    const res = await fetch("/api/frequent-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, personIds: [...selected] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Lỗi");
      return;
    }
    setLabel("");
    setSelected(new Set());
    load();
  }

  async function remove(id: string) {
    setError("");
    const res = await fetch(`/api/frequent-groups/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không xóa được");
      throw new Error(data.error);
    }
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bộ người hay đi</h2>
      {error && (
        <p className="text-sm" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}

      <form onSubmit={save} className="card space-y-3">
        <input
          className="input"
          placeholder="Tên bộ (vd: 5 đồng nghiệp cơm trưa)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`tier-btn ${selected.has(p.id) ? "active" : ""}`}
              onClick={() =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(p.id)) next.delete(p.id);
                  else next.add(p.id);
                  return next;
                })
              }
            >
              {p.name}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Lưu bộ mới
        </button>
      </form>

      <ul className="space-y-3">
        {groups.map((g) => (
          <li key={g.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{g.label}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {g.members.map((m) => m.person.name).join(", ")}
                </p>
              </div>
              <DeleteButton label={g.label} onDelete={() => remove(g.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
