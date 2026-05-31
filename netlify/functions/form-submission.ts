import type { Handler, HandlerEvent } from "@netlify/functions";

/** Netlify Forms webhook → forward sang Google Apps Script */
export const handler: Handler = async (event: HandlerEvent) => {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return { statusCode: 500, body: "Missing GOOGLE_SCRIPT_URL" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body || "{}",
    });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (e) {
    return {
      statusCode: 500,
      body: e instanceof Error ? e.message : "Error",
    };
  }
};
