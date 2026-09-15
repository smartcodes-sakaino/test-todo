export function nowIso(): string {
  return new Date().toISOString();
}

export function todayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export interface TaskRow {
  id: string;
  name: string;
  due: string | null;
  memo: string | null;
  done: number;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  name: string;
  due: string | null;
  memo: string | null;
  done: boolean;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    due: row.due,
    memo: row.memo,
    done: !!row.done,
    completedDate: row.completed_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
