const { chromium } = require("playwright");
const fs = require("fs-extra");
const path = require("path");

const EXPERIMENT_DIR = path.resolve("experiment");

async function selectExperimentFolder() {
  const { default: inquirer } = await import("inquirer");

  const folders = fs
    .readdirSync(EXPERIMENT_DIR)
    .filter((f) => fs.lstatSync(path.join(EXPERIMENT_DIR, f)).isDirectory());
  const { folder } = await inquirer.prompt({
    name: "folder",
    type: "list",
    message: "폴더를 선택해주세요:",
    choices: folders,
  });
  return folder;
}

async function selectLogFile(folderPath) {
  const { default: inquirer } = await import("inquirer");

  const logDir = path.join(folderPath, "log");
  const files = fs.readdirSync(logDir);
  const { file } = await inquirer.prompt({
    name: "file",
    type: "list",
    message: "로그 파일을 선택해주세요:",
    choices: files,
  });
  return path.join(logDir, file);
}

async function clickOptionMenu(page, childrenIndex) {
  await page.waitForSelector("ms-chat-turn-options");
  const prompts = await page.$$("ms-chat-turn");
  const last = prompts[prompts.length - 1];
  await last.hover();

  const options = await last.$("ms-chat-turn-options");
  const button = await options.$("button");
  await button.click();

  await page.waitForSelector(".mat-mdc-menu-content");
  const menus = await page.$$(".mat-mdc-menu-content");
  const buttons = await menus[0].$$("button");

  await buttons[childrenIndex].click();
  await page.waitForTimeout(500);
}

async function writeTextarea(page, text) {
  const { default: clipboard } = await import("clipboardy");

  await clipboard.write(text);
  const textarea = await page.$("textarea");
  await textarea.fill("");
  await textarea.click();
  await page.keyboard.press(`Control+V`);
}

async function runAndWait(page) {
  await page.click(".run-button");
  await page.waitForSelector(".stoppable");
  await page.waitForSelector(".stoppable", {
    state: "detached",
    timeout: 3000000,
  });
}

function replacePlaceholders(text, label, logContent) {
  const wrappedLog = "```\n" + logContent + "\n```";

  return text.replaceAll("{label}", label).replaceAll("{log}", wrappedLog);
}

function saveClipboardToPath(baseFolder, label, mdPath, content) {
  const fullDir = path.join(baseFolder, "KB", label, path.dirname(mdPath));
  const fullFile = path.join(fullDir, path.basename(mdPath));

  fs.mkdirSync(fullDir, { recursive: true });
  fs.writeFileSync(fullFile, content);
}

async function processMDList(page, baseFolder, label) {
  const { default: clipboard } = await import("clipboardy");

  await clickOptionMenu(page, 3);
  const clipboardContent = await clipboard.read();
  const mdLines = clipboardContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".md"));

  console.log("📋 업데이트된 파일 목록: ", mdLines);

  for (const mdFile of mdLines) {
    console.log(`📌 ${mdFile} 처리 중...`);

    await writeTextarea(page, mdFile);
    await runAndWait(page);
    await clickOptionMenu(page, 3);

    const copied = await clipboard.read();
    saveClipboardToPath(baseFolder, label, mdFile, copied);
  }
}

async function main() {
  const { default: inquirer } = await import("inquirer");

  // 경로 선택
  const folder = await selectExperimentFolder();
  const folderPath = path.join(EXPERIMENT_DIR, folder);
  const logPath = await selectLogFile(folderPath);
  const logContent = fs.readFileSync(logPath, "utf-8");

  const { label } = await inquirer.prompt({
    name: "label",
    type: "input",
    message: "로그 이름을 입력하세요:",
  });

  console.log(`📁 폴더: ${folder}`);
  console.log(`📝 로그: ${logPath}`);
  console.log(`🏷️ 라벨: ${label}`);

  // 구글 AI 스튜디오 접속
  const browser = await chromium.launchPersistentContext("./user_data", {
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
    viewport: { width: 2560, height: 1080 },
  });

  const pages = browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  await page.goto(
    "https://aistudio.google.com/u/1/prompts/1XvpEt1Ygr9EKB8SA9aNuQfRH7VuGJgO-",
  );
  await page.waitForSelector("textarea", { timeout: 60000 });

  // 이전 대화 내역 전부 삭제
  while ((await page.$("ms-chat-turn-options")) !== null) {
    await clickOptionMenu(page, 0);
    console.log("🗑 이전 대화 내역을 삭제했습니다.");
  }

  // KB.txt 내용 입력
  const kbText = fs.readFileSync(path.join(folderPath, "KB.txt"), "utf-8");

  await writeTextarea(page, kbText);
  await runAndWait(page);

  // 사용자가 선택한 로그 내용 입력
  const updatePath = path.join(EXPERIMENT_DIR, "update.txt");
  const updateRaw = fs.readFileSync(updatePath, "utf-8");
  const replacedUpdate = replacePlaceholders(updateRaw, label, logContent);

  await writeTextarea(page, replacedUpdate);
  await runAndWait(page);

  // 업데이트된 지식 베이스 파일 목록 추출 및 반영
  await processMDList(page, folderPath, label);

  // KB/latest 폴더에 복사
  const latestDir = path.join(folderPath, "KB", "latest");
  const labelDir = path.join(folderPath, "KB", label);

  fs.cpSync(labelDir, latestDir, { recursive: true });
  console.log("📌 KB/latest 복사가 완료되었습니다!");

  await browser.close();
  console.log("\n✨ 지식 베이스 작업 완료!");
}

main().catch(console.error);
