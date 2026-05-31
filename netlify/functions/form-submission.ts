import type { Handler, HandlerEvent } from "@netlify/functions";

/**
 * Webhook Netlify Forms → ghi bill qua API app.
 * Cấu hình: Site settings → Forms → Form notifications → Outgoing webhook
 * URL: https://YOUR-SITE.netlify.app/.netlify/functions/form-submission
 *
 * Env: URL (tự có trên Netlify), DATABASE_URL (Turso khuyến nghị production)
 */
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload: Record<string, string> = {};
  const contentType = event.headers["content-type"] || "";

  try {
    if (contentType.includes("application/json")) {
      payload = JSON.parse(event.body || "{}");
    } else {
      const params = new URLSearchParams(event.body || "");
      params.forEach((v, k) => {
        payload[k] = v;
      });
    }
  } catch {
    return { statusCode: 400, body: "Invalid body" };
  }

  const data = payload.data ? JSON.parse(payload.data as unknown as string) : payload;
  const fields: Record<string, string> = {};
  if (Array.isArray(data)) {
    for (const item of data as { name: string; value: string }[]) {
      fields[item.name] = item.value;
    }
  } else {
    Object.assign(fields, data);
  }

  const submissionId =
    (payload.id as string) || fields["submission-id"] || `netlify-${Date.now()}`;

  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000";
  const amountsJson = fields["amounts-json"];
  const participants = (fields.participants || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let tierAmounts: { personId: string; amount: number }[] = [];
  let participantIds: string[] = [];

  try {
    const peopleRes = await fetch(`${siteUrl}/api/people`);
    const people: { id: string; name: string }[] = await peopleRes.json();
    const nameToId = new Map(people.map((p) => [p.name, p.id]));

    if (amountsJson) {
      const parsed = JSON.parse(amountsJson) as Record<string, number>;
      tierAmounts = Object.entries(parsed).map(([name, amount]) => ({
        personId: nameToId.get(name) || name,
        amount: Number(amount),
      }));
      participantIds = tierAmounts.map((t) => t.personId);
    } else {
      participantIds = participants
        .map((n) => nameToId.get(n))
        .filter((id): id is string => !!id);
    }

    const body = {
      expenseDate: fields["expense-date"] || new Date().toISOString().slice(0, 10),
      description: fields.description || "Chi tiêu (Forms)",
      splitMode:
        fields["split-mode"] === "equal" || fields["split-mode"] === "custom"
          ? fields["split-mode"]
          : "tier",
      totalAmount: fields["total-amount"]
        ? parseInt(fields["total-amount"], 10)
        : undefined,
      participantIds,
      tierAmounts: tierAmounts.length ? tierAmounts : undefined,
      frequentGroupLabel: fields["frequent-group"],
      submissionId,
    };

    const res = await fetch(`${siteUrl}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, body: err };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return {
      statusCode: 500,
      body: e instanceof Error ? e.message : "Error",
    };
  }
};
