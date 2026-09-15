import { nowIso, rowToTask, todayStr, type TaskRow } from "../../lib/taskRow";

interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = params.id as string;
  const existing = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first<TaskRow>();
  if (!existing) {
    return Response.json({ error: "タスクが見つかりません" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; due?: unknown; memo?: unknown; done?: unknown }
    | null;

  let name = existing.name;
  if (typeof body?.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return Response.json({ error: "タスク名は必須です" }, { status: 400 });
    }
    name = trimmed;
  }

  const due = body && "due" in body ? ((body.due as string) || null) : existing.due;
  const memo = body && "memo" in body ? ((body.memo as string) ?? null) : existing.memo;

  let done = existing.done;
  let completedDate = existing.completed_date;
  if (typeof body?.done === "boolean") {
    done = body.done ? 1 : 0;
    completedDate = body.done ? todayStr() : null;
  }

  const now = nowIso();
  await env.DB.prepare(
    "UPDATE tasks SET name = ?, due = ?, memo = ?, done = ?, completed_date = ?, updated_at = ? WHERE id = ?"
  )
    .bind(name, due, memo, done, completedDate, now, id)
    .run();

  return Response.json(
    rowToTask({
      id,
      name,
      due,
      memo,
      done,
      completed_date: completedDate,
      created_at: existing.created_at,
      updated_at: now,
    })
  );
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = params.id as string;
  const existing = await env.DB.prepare("SELECT id FROM tasks WHERE id = ?").bind(id).first();
  if (!existing) {
    return Response.json({ error: "タスクが見つかりません" }, { status: 404 });
  }
  await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
};
