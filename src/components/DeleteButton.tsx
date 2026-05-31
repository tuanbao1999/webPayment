"use client";

import { useState } from "react";

export function DeleteButton({
  label,
  onDelete,
}: {
  label?: string;
  onDelete: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm(label ? `Xóa "${label}"?` : "Xóa mục này?")) return;
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary text-sm"
      style={{ color: "#f87171", borderColor: "#f87171" }}
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "..." : "Xóa"}
    </button>
  );
}
