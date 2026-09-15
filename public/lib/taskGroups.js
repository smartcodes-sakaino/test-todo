export function todayStr(date = new Date()) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

/**
 * Splits tasks into: open (not done), doneToday (done, completedDate === today),
 * and pastDone (done, completedDate !== today), sorted newest-completed-first.
 */
export function groupTasks(tasks, today = todayStr()) {
  const open = tasks.filter((t) => !t.done);
  const doneToday = tasks.filter((t) => t.done && t.completedDate === today);
  const pastDone = tasks
    .filter((t) => t.done && t.completedDate !== today)
    .sort((a, b) => (b.completedDate ?? "").localeCompare(a.completedDate ?? ""));
  return { open, doneToday, pastDone };
}
