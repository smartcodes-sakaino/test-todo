import { describe, it, expect } from "vitest";
import { buildMailBody, buildGmailComposeUrl } from "../public/lib/mailBody.js";

const template = {
  to: "test@sakaino.jp",
  subject: "Claudeテスト",
  greeting: "お疲れ様です。",
  intro: "本日完了したタスクは以下の通りです。",
  closing: "以上、よろしくお願いいたします。",
};

describe("buildMailBody", () => {
  it("lists completed tasks with memo in parentheses", () => {
    const body = buildMailBody(template, [
      { name: "見積書を送付する", memo: "先方に確認済みの単価で" },
      { name: "請求書を発行する", memo: "" },
    ]);
    expect(body).toContain("・見積書を送付する(先方に確認済みの単価で)");
    expect(body).toContain("・請求書を発行する");
    expect(body).not.toContain("請求書を発行する()");
    expect(body.startsWith(template.greeting)).toBe(true);
    expect(body.endsWith(template.closing)).toBe(true);
  });

  it("falls back to a placeholder line when there are no completed tasks", () => {
    const body = buildMailBody(template, []);
    expect(body).toContain("・本日完了したタスクはありませんでした。");
  });
});

describe("buildGmailComposeUrl", () => {
  it("encodes to/subject/body into a Gmail compose URL", () => {
    const url = buildGmailComposeUrl(template, "line1\nline2");
    expect(url.startsWith("https://mail.google.com/mail/?")).toBe(true);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("view")).toBe("cm");
    expect(parsed.searchParams.get("to")).toBe(template.to);
    expect(parsed.searchParams.get("su")).toBe(template.subject);
    expect(parsed.searchParams.get("body")).toBe("line1\nline2");
  });
});
