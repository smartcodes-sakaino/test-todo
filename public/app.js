import { groupTasks } from "./lib/taskGroups.js";
import { buildMailBody, buildGmailComposeUrl } from "./lib/mailBody.js";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${m}/${d}(${WEEKDAYS[dt.getDay()]})`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `${res.status} エラーが発生しました`);
  }
  return res.status === 204 ? null : res.json();
}

const el = (id) => document.getElementById(id);

const state = {
  tasks: [],
  template: { to: "", subject: "", greeting: "", intro: "", closing: "" },
  editingId: null,
  pendingDeleteId: null,
  pastVisible: false,
};

const refs = {
  todayLabel: el("todayLabel"),
  progressPill: el("progressPill"),
  newTaskBtn: el("newTaskBtn"),
  openList: el("openTasksList"),
  openEmpty: el("openEmpty"),
  doneTodayList: el("doneTodayList"),
  doneTodayEmpty: el("doneTodayEmpty"),
  doneTodayCount: el("doneTodayCount"),
  pastToggleBtn: el("pastToggleBtn"),
  pastDoneList: el("pastDoneList"),
  summaryCount: el("summaryCount"),
  summaryNames: el("summaryNames"),
  reportBtn: el("reportBtn"),
  reportHint: el("reportHint"),

  taskModalOverlay: el("taskModalOverlay"),
  taskModalTitle: el("taskModalTitle"),
  taskForm: el("taskForm"),
  taskNameInput: el("taskNameInput"),
  taskDueInput: el("taskDueInput"),
  taskMemoInput: el("taskMemoInput"),
  taskSubmitBtn: el("taskSubmitBtn"),
  taskCancelBtn: el("taskCancelBtn"),

  deleteConfirmOverlay: el("deleteConfirmOverlay"),
  deleteConfirmMessage: el("deleteConfirmMessage"),
  deleteConfirmBtn: el("deleteConfirmBtn"),
  deleteCancelBtn: el("deleteCancelBtn"),

  templateSettingsBtn: el("templateSettingsBtn"),
  templateModalOverlay: el("templateModalOverlay"),
  templateForm: el("templateForm"),
  tplToInput: el("tplToInput"),
  tplSubjectInput: el("tplSubjectInput"),
  tplGreetingInput: el("tplGreetingInput"),
  tplIntroInput: el("tplIntroInput"),
  tplClosingInput: el("tplClosingInput"),
  templateCancelBtn: el("templateCancelBtn"),
  templateResetBtn: el("templateResetBtn"),

  reportModalOverlay: el("reportModalOverlay"),
  reportToInput: el("reportToInput"),
  reportSubjectInput: el("reportSubjectInput"),
  reportBodyInput: el("reportBodyInput"),
  reportCopyBtn: el("reportCopyBtn"),
  reportGmailLink: el("reportGmailLink"),
  reportCloseBtn: el("reportCloseBtn"),
  reportStatus: el("reportStatus"),
};

{
  const now = new Date();
  refs.todayLabel.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日(${WEEKDAYS[now.getDay()]})`;
}

function dueBadge(t) {
  if (!t.due) return "";
  const today = new Date().toISOString().slice(0, 10);
  let cls = "due-future";
  let label = fmtDate(t.due);
  if (!t.done) {
    if (t.due < today) {
      cls = "due-over";
      label = "期限超過 " + label;
    } else if (t.due === today) {
      cls = "due-today";
      label = "本日期限";
    }
  }
  return `<span class="badge ${cls}">${label}</span>`;
}

function taskItemHtml(t, opts = {}) {
  const memoHtml = t.memo ? `<div class="task-memo">${escapeHtml(t.memo)}</div>` : "";
  const completedBadge = t.done && opts.showCompletedOn ? `<span class="badge completed-on">${fmtDate(t.completedDate)}完了</span>` : "";
  return `
    <li class="task ${t.done ? "done" : ""}" data-id="${t.id}">
      <input type="checkbox" ${t.done ? "checked" : ""} aria-label="完了にする" data-action="toggle">
      <div class="task-main">
        <div class="task-name">${escapeHtml(t.name)}</div>
        <div class="task-meta">${dueBadge(t)}${completedBadge}</div>
        ${memoHtml}
      </div>
      <div class="task-actions">
        ${opts.editable !== false ? `<button type="button" class="icon-btn" data-action="edit" title="編集" aria-label="編集">✎</button>` : ""}
        <button type="button" class="icon-btn danger" data-action="delete" title="削除" aria-label="削除">✕</button>
      </div>
    </li>`;
}

function render() {
  const { open, doneToday, pastDone } = groupTasks(state.tasks);

  refs.openList.innerHTML = open.map((t) => taskItemHtml(t)).join("");
  refs.openEmpty.hidden = open.length > 0;

  refs.doneTodayList.innerHTML = doneToday.map((t) => taskItemHtml(t)).join("");
  refs.doneTodayEmpty.hidden = doneToday.length > 0;
  refs.doneTodayCount.textContent = doneToday.length ? `(${doneToday.length}件)` : "";

  refs.pastToggleBtn.hidden = pastDone.length === 0;
  refs.pastToggleBtn.textContent = state.pastVisible
    ? "完了済みタスクの履歴を隠す"
    : `これまで完了したタスクをすべて見る(${pastDone.length}件)`;
  refs.pastDoneList.hidden = !state.pastVisible;
  refs.pastDoneList.innerHTML = pastDone.map((t) => taskItemHtml(t, { editable: false, showCompletedOn: true })).join("");

  refs.summaryCount.textContent = doneToday.length;
  refs.summaryNames.innerHTML = doneToday.map((t) => `<span class="chip">${escapeHtml(t.name)}</span>`).join("");
  refs.reportHint.hidden = doneToday.length > 0;
  refs.progressPill.textContent = `${doneToday.length}/${state.tasks.length} 完了`;
}

async function loadTasks() {
  state.tasks = await api("/api/tasks");
  render();
}

async function loadTemplate() {
  state.template = await api("/api/template");
}

/* ---- 新規/編集タスク モーダル ---- */
function openTaskModal(mode, task) {
  state.editingId = mode === "edit" ? task.id : null;
  refs.taskModalTitle.textContent = mode === "edit" ? "タスクを編集" : "新しいタスク";
  refs.taskSubmitBtn.textContent = mode === "edit" ? "更新" : "追加";
  if (mode === "edit") {
    refs.taskNameInput.value = task.name;
    refs.taskDueInput.value = task.due || "";
    refs.taskMemoInput.value = task.memo || "";
  } else {
    refs.taskForm.reset();
  }
  refs.taskModalOverlay.hidden = false;
  refs.taskNameInput.focus();
}
function closeTaskModal() {
  refs.taskModalOverlay.hidden = true;
  state.editingId = null;
}
refs.newTaskBtn.addEventListener("click", () => openTaskModal("create"));
refs.taskCancelBtn.addEventListener("click", closeTaskModal);
refs.taskModalOverlay.addEventListener("click", (e) => {
  if (e.target === refs.taskModalOverlay) closeTaskModal();
});

refs.taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = refs.taskNameInput.value.trim();
  if (!name) return;
  const due = refs.taskDueInput.value || null;
  const memo = refs.taskMemoInput.value.trim();

  refs.taskSubmitBtn.disabled = true;
  try {
    if (state.editingId) {
      await api(`/api/tasks/${state.editingId}`, { method: "PUT", body: JSON.stringify({ name, due, memo }) });
    } else {
      await api("/api/tasks", { method: "POST", body: JSON.stringify({ name, due, memo }) });
    }
    closeTaskModal();
    await loadTasks();
  } catch (err) {
    alert(err.message);
  } finally {
    refs.taskSubmitBtn.disabled = false;
  }
});

/* ---- 削除確認 モーダル ---- */
function requestDelete(task) {
  state.pendingDeleteId = task.id;
  refs.deleteConfirmMessage.textContent = `「${task.name}」を削除します。よろしいですか?`;
  refs.deleteConfirmOverlay.hidden = false;
}
function closeDeleteConfirm() {
  state.pendingDeleteId = null;
  refs.deleteConfirmOverlay.hidden = true;
}
refs.deleteCancelBtn.addEventListener("click", closeDeleteConfirm);
refs.deleteConfirmOverlay.addEventListener("click", (e) => {
  if (e.target === refs.deleteConfirmOverlay) closeDeleteConfirm();
});
refs.deleteConfirmBtn.addEventListener("click", async () => {
  const id = state.pendingDeleteId;
  if (!id) return;
  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    if (state.editingId === id) closeTaskModal();
    closeDeleteConfirm();
    await loadTasks();
  } catch (err) {
    alert(err.message);
  }
});

/* ---- 一覧内の操作(完了切替/編集/削除) ---- */
async function handleListClick(e) {
  const btn = e.target.closest("[data-action]");
  const li = e.target.closest("li.task");
  if (!li) return;
  const id = li.dataset.id;
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  const action = btn ? btn.dataset.action : e.target.matches("input[type=checkbox]") ? "toggle" : null;

  if (action === "toggle") {
    try {
      await api(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify({ done: !task.done }) });
      await loadTasks();
    } catch (err) {
      alert(err.message);
      await loadTasks();
    }
  } else if (action === "edit") {
    openTaskModal("edit", task);
  } else if (action === "delete") {
    requestDelete(task);
  }
}
for (const list of [refs.openList, refs.doneTodayList, refs.pastDoneList]) {
  list.addEventListener("click", handleListClick);
  list.addEventListener("change", handleListClick);
}

refs.pastToggleBtn.addEventListener("click", () => {
  state.pastVisible = !state.pastVisible;
  render();
});

/* ---- テンプレート設定 モーダル ---- */
function openTemplateModal() {
  refs.tplToInput.value = state.template.to;
  refs.tplSubjectInput.value = state.template.subject;
  refs.tplGreetingInput.value = state.template.greeting;
  refs.tplIntroInput.value = state.template.intro;
  refs.tplClosingInput.value = state.template.closing;
  refs.templateModalOverlay.hidden = false;
}
function closeTemplateModal() {
  refs.templateModalOverlay.hidden = true;
}
refs.templateSettingsBtn.addEventListener("click", openTemplateModal);
refs.templateCancelBtn.addEventListener("click", closeTemplateModal);
refs.templateModalOverlay.addEventListener("click", (e) => {
  if (e.target === refs.templateModalOverlay) closeTemplateModal();
});
refs.templateResetBtn.addEventListener("click", () => {
  refs.tplToInput.value = "test@sakaino.jp";
  refs.tplSubjectInput.value = "Claudeテスト";
  refs.tplGreetingInput.value = "お疲れ様です。";
  refs.tplIntroInput.value = "本日完了したタスクは以下の通りです。";
  refs.tplClosingInput.value = "以上、よろしくお願いいたします。";
});
refs.templateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    to: refs.tplToInput.value.trim(),
    subject: refs.tplSubjectInput.value.trim(),
    greeting: refs.tplGreetingInput.value.trim(),
    intro: refs.tplIntroInput.value.trim(),
    closing: refs.tplClosingInput.value.trim(),
  };
  try {
    state.template = await api("/api/template", { method: "PUT", body: JSON.stringify(payload) });
    closeTemplateModal();
  } catch (err) {
    alert(err.message);
  }
});

/* ---- 日報コピー モーダル ---- */
refs.reportBtn.addEventListener("click", () => {
  const { doneToday } = groupTasks(state.tasks);
  const body = buildMailBody(state.template, doneToday);
  refs.reportToInput.value = state.template.to;
  refs.reportSubjectInput.value = state.template.subject;
  refs.reportBodyInput.value = body;
  refs.reportGmailLink.href = buildGmailComposeUrl(state.template, body);
  refs.reportStatus.hidden = true;
  refs.reportModalOverlay.hidden = false;
});
function closeReportModal() {
  refs.reportModalOverlay.hidden = true;
}
refs.reportCloseBtn.addEventListener("click", closeReportModal);
refs.reportModalOverlay.addEventListener("click", (e) => {
  if (e.target === refs.reportModalOverlay) closeReportModal();
});
refs.reportCopyBtn.addEventListener("click", async () => {
  const text = `宛先: ${refs.reportToInput.value}\n件名: ${refs.reportSubjectInput.value}\n\n${refs.reportBodyInput.value}`;
  try {
    await navigator.clipboard.writeText(text);
    refs.reportStatus.hidden = false;
    refs.reportStatus.className = "status-line done";
    refs.reportStatus.textContent = "コピーしました";
  } catch (err) {
    refs.reportStatus.hidden = false;
    refs.reportStatus.className = "status-line error";
    refs.reportStatus.textContent = "コピーに失敗しました。本文を選択してコピーしてください。";
    refs.reportBodyInput.focus();
    refs.reportBodyInput.select();
  }
});

/* ---- 初期読み込み ---- */
(async function init() {
  try {
    await Promise.all([loadTasks(), loadTemplate()]);
  } catch (err) {
    alert("データの読み込みに失敗しました。時間をおいて再度お試しください。\n" + err.message);
  }
})();
