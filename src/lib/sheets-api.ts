const BASE = process.env.GOOGLE_SCRIPT_URL;

export async function sheetsRequest<T>(
  action: string,
  params: Record<string, unknown> = {},
  method: "GET" | "POST" = "POST"
): Promise<T> {
  if (!BASE) {
    throw new Error(
      "Chưa cấu hình GOOGLE_SCRIPT_URL. Xem google-apps-script/README.md"
    );
  }

  if (method === "GET") {
    const q = new URLSearchParams({ action, ...stringifyParams(params) });
    const res = await fetch(`${BASE}?${q}`, { cache: "no-store" });
    return parseResponse<T>(res);
  }

  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
    cache: "no-store",
  });
  return parseResponse<T>(res);
}

function stringifyParams(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) out[k] = String(v);
  }
  return out;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || (data && typeof data === "object" && "error" in data && data.error)) {
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : `Sheets API lỗi ${res.status}`
    );
  }
  return data as T;
}
