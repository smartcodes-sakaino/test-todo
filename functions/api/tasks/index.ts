import { nowIso, rowToTask, type TaskRow } from "../../lib/taskRow";

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id, name, due, memo, done, completed_date, created_at, updated_at FROM tasks ORDER BY created_at ASC"
  ).all<TaskRow>();
  return Response.json((results ?? []).map(rowToTask));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; due?: unknown; memo?: unknown }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "タスク名は必須です" }, { status: 400 });
  }
  const due = typeof body?.due === "string" && body.due ? body.due : null;
  const memo = typeof body?.memo === "string" ? body.memo : null;

  const id = crypto.randomUUID();
  const now = nowIso();

  await env.DB.prepare(
    "INSERT INTO tasks (id, name, due, memo, done, completed_date, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NULL, ?, ?)"
  )
    .bind(id, name, due, memo, now, now)
    .run();

  return Response.json(
    rowToTask({ id, name, due, memo, done: 0, completed_date: null, created_at: now, updated_at: now }),
    { status: 201 }
  );
};
