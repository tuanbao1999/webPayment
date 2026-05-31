"use client";

import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";

type Person = { id: string; name: string };

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/people")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPeople(data);
        else setError(data.error || "Lỗi tải danh sách");
      });

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Lỗi");
      return;
    }
    setName("");
    load();
  }

  async function remove(id: string) {
    setError("");
    const res = await fetch(`/api/people/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không xóa được");
      throw new Error(data.error);
    }
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Danh bạ người</h2>
      {error && (
        <p className="text-sm" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <form onSubmit={add} className="card flex gap-2">
        <input
          className="input flex-1"
          placeholder="Tên mới"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Thêm
        </button>
      </form>
      <ul className="card space-y-2">
        {people.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2">
            <span>{p.name}</span>
            <DeleteButton label={p.name} onDelete={() => remove(p.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
