export function buildMailBody(template, doneTodayTasks) {
  const list = doneTodayTasks.length
    ? doneTodayTasks.map((t) => "・" + t.name + (t.memo ? `(${t.memo})` : "")).join("\n")
    : "・本日完了したタスクはありませんでした。";
  return `${template.greeting}\n\n${template.intro}\n\n${list}\n\n${template.closing}`;
}

export function buildGmailComposeUrl(template, body) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: template.to,
    su: template.subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
