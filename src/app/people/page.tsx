"use client";

import { useEffect, useState } from "react";

type Person = { id: string; name: string };

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");

  const load = () => fetch("/api/people").then((r) => r.json()).then(setPeople);

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Danh bạ người</h2>
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
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
