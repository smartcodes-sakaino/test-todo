import { describe, it, expect } from "vitest";
import { groupTasks, todayStr } from "../public/lib/taskGroups.js";

const today = "2026-09-15";
const yesterday = "2026-09-14";

function task(overrides) {
  return {
    id: "id-1",
    name: "サンプルタスク",
    due: null,
    memo: null,
    done: false,
    completedDate: null,
    ...overrides,
  };
}

describe("groupTasks", () => {
  it("puts not-done tasks into open", () => {
    const tasks = [task({ id: "1", done: false })];
    const { open, doneToday, pastDone } = groupTasks(tasks, today);
    expect(open).toHaveLength(1);
    expect(doneToday).toHaveLength(0);
    expect(pastDone).toHaveLength(0);
  });

  it("puts tasks completed today into doneToday", () => {
    const tasks = [task({ id: "1", done: true, completedDate: today })];
    const { open, doneToday, pastDone } = groupTasks(tasks, today);
    expect(open).toHaveLength(0);
    expect(doneToday).toHaveLength(1);
    expect(pastDone).toHaveLength(0);
  });

  it("puts tasks completed on a previous day into pastDone, not doneToday", () => {
    const tasks = [task({ id: "1", done: true, completedDate: yesterday })];
    const { doneToday, pastDone } = groupTasks(tasks, today);
    expect(doneToday).toHaveLength(0);
    expect(pastDone).toHaveLength(1);
  });

  it("sorts pastDone by completedDate, newest first", () => {
    const tasks = [
      task({ id: "old", done: true, completedDate: "2026-09-01" }),
      task({ id: "new", done: true, completedDate: "2026-09-10" }),
    ];
    const { pastDone } = groupTasks(tasks, today);
    expect(pastDone.map((t) => t.id)).toEqual(["new", "old"]);
  });

  it("todayStr formats a given date as YYYY-MM-DD", () => {
    expect(todayStr(new Date(2026, 8, 15))).toBe("2026-09-15");
  });
});
