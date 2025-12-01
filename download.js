#!/usr/bin/env node
const { chromium } = require("playwright");
const fs = require("fs-extra");
const path = require("path");

const XP_URL = "https://morgrave.github.io/xperion";
const MORGRAVE_URL = "https://morgrave.github.io/bookstore";

async function main() {
  const { default: inquirer } = await import("inquirer");
  const { default: clipboard } = await import("clipboardy");

  console.log("🚀 Xperion Scraping Utility Started!");

  const site = await inquirer.prompt([
    {
      type: "list",
      name: "url",
      message: "원하는 저장소를 선택하세요:",
      choices: [XP_URL, MORGRAVE_URL],
    },
  ]);

  const BASE_URL = site.url;

  const browser = await chromium.launch({
    headless: false, // 브라우저 동작 시각화
    slowMo: 50,
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
  });
  const page = await context.newPage();

  console.log("🌐 사이트 접속 중...");
  await page.goto(BASE_URL, { waitUntil: "load" });

  console.log("📌 data-title 엘리먼트 목록 수집...");
  await page.waitForSelector("[data-title]");
  const titles = await page.$$eval("[data-title]", (els) => {
    return els.map((el) => ({
      title: el.getAttribute("data-title"),
      index: el.getAttribute("data-index"),
    }));
  });

  const userChoice = await inquirer.prompt([
    {
      type: "list",
      name: "selectedTitle",
      message: "원하는 data-title을 선택하세요:",
      choices: titles.map((t) => t.title),
    },
  ]);

  const selectedTitle = userChoice.selectedTitle;
  console.log(`👉 선택됨: ${selectedTitle}`);

  console.log("🖱️ 해당 항목 클릭하여 사이드바 로딩 대기...");
  await page.click(`[data-title="${selectedTitle}"]`);
  await page.waitForTimeout(1000);

  console.log("🔍 data-group 수집...");
  const filtered = await page.$$eval(
    "[data-group]",
    (els, selectedTitle) => {
      return els
        .filter((el) => el.getAttribute("data-parent") === selectedTitle)
        .map((el) => ({
          group: el.getAttribute("data-group"),
          index: el.getAttribute("data-index"),
          parent: el.getAttribute("data-parent"),
        }));
    },
    selectedTitle,
  );

  console.log(`📦 총 ${filtered.length}개 페이지를 순회합니다.`);

  const viewportSize = page.viewportSize();

  await page.setViewportSize({
    width: 700,
    height: viewportSize ? viewportSize.height : 800,
  });

  for (const item of filtered) {
    const url = `${BASE_URL}/viewer/${item.group}/${item.index}`;
    console.log(`🌍 페이지 이동: ${url}`);

    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    console.log("📋 전체 내용 클립보드에 복사...");
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+C");
    await page.waitForTimeout(300);

    const content = await clipboard.read();

    const saveDir = path.join("experiment", item.group, "log");
    await fs.ensureDir(saveDir);

    const filePath = path.join(saveDir, `${item.index}.html`);
    await fs.writeFile(filePath, content, "utf8");

    console.log(`💾 저장 완료: ${filePath}`);

    // 파일 후처리: 맨 위 2줄 제거, 그리고 'avatar' 한 글자 줄 제거
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    const afterDropFirst2 = lines.slice(2); // 맨 위 2줄 제거
    const filteredLines = afterDropFirst2.filter(
      (line) => line.trim() !== "avatar",
    );
    const finalContent = filteredLines.join("\n");
    await fs.writeFile(filePath, finalContent, "utf8");
    console.log("✅ 후처리 완료: 상단 2줄 제거, avatar 한 글자 줄 제거");
  }

  console.log("🎉 모든 작업이 완료되었습니다.");
  await browser.close();
}

main().catch((err) => {
  console.error("❌ 오류 발생:", err);
});
