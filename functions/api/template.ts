interface Env {
  DB: D1Database;
}

interface SettingsRow {
  to_addr: string;
  subject: string;
  greeting: string | null;
  intro: string | null;
  closing: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare(
    "SELECT to_addr, subject, greeting, intro, closing FROM settings WHERE id = 1"
  ).first<SettingsRow>();

  if (!row) {
    return Response.json({ error: "設定が見つかりません" }, { status: 404 });
  }

  return Response.json({
    to: row.to_addr,
    subject: row.subject,
    greeting: row.greeting ?? "",
    intro: row.intro ?? "",
    closing: row.closing ?? "",
  });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as
    | { to?: unknown; subject?: unknown; greeting?: unknown; intro?: unknown; closing?: unknown }
    | null;

  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  if (!to || !subject) {
    return Response.json({ error: "宛先と件名は必須です" }, { status: 400 });
  }
  const greeting = typeof body?.greeting === "string" ? body.greeting : "";
  const intro = typeof body?.intro === "string" ? body.intro : "";
  const closing = typeof body?.closing === "string" ? body.closing : "";
  const now = new Date().toISOString();

  await env.DB.prepare(
    "UPDATE settings SET to_addr = ?, subject = ?, greeting = ?, intro = ?, closing = ?, updated_at = ? WHERE id = 1"
  )
    .bind(to, subject, greeting, intro, closing, now)
    .run();

  return Response.json({ to, subject, greeting, intro, closing });
};
