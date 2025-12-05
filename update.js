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
    message: "Select a folder:",
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
    message: "Select log file:",
    choices: files,
  });
  return path.join(logDir, file);
}

async function clickOptionMenu(page, childrenIndex) {
  await page.waitForSelector("ms-chat-turn-options");
  const options = await page.$$("ms-chat-turn-options");
  const last = options[options.length - 1];

  const button = await last.$("button");
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
    timeout: 300000,
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

  const clipboardContent = await clipboard.read();
  const mdLines = clipboardContent
    .split("\n")
    .filter((line) => line.endsWith(".md"));

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

  // ── Step 1: Select folder, log file, label ───────────────
  const folder = await selectExperimentFolder();
  const folderPath = path.join(EXPERIMENT_DIR, folder);
  const logPath = await selectLogFile(folderPath);
  const logContent = fs.readFileSync(logPath, "utf-8");

  const { label } = await inquirer.prompt({
    name: "label",
    type: "input",
    message: "로그 이름을 입력하세요:",
  });

  console.log(`📁 Folder: ${folder}`);
  console.log(`📝 Log: ${logPath}`);
  console.log(`🏷 Label: ${label}`);

  // ── Step 2: Playwright Launch ───────────────
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

  await page.waitForTimeout(5000000);

  // ── Step 3: Remove auto-added options ───────────────
  while ((await page.$("ms-chat-turn-options")) !== null) {
    await clickOptionMenu(page, 0);
    console.log("🗑 이전 대화 내역을 삭제했습니다.");
  }

  // ── Step 4: Submit KB.txt ───────────────
  const kbText = fs.readFileSync(path.join(folderPath, "KB.txt"), "utf-8");

  await writeTextarea(page, kbText);
  await runAndWait(page);

  // ── Step 5: Submit update.txt with replaced placeholders ───────────────
  const updatePath = path.join(folderPath, "update.txt");
  const updateRaw = fs.readFileSync(updatePath, "utf-8");
  const replacedUpdate = replacePlaceholders(updateRaw, label, logContent);

  await writeTextarea(page, replacedUpdate);
  await runAndWait(page);

  // ── Step 6: Copy MD references ───────────────
  await clickOptionMenu(page, 3);
  await processMDList(page, folderPath, label);

  // ── Step 7: Copy to KB/latest ───────────────
  const latestDir = path.join(folderPath, "KB", "latest");
  const labelDir = path.join(folderPath, "KB", label);

  fs.cpSync(labelDir, latestDir, { recursive: true });
  console.log("📌 KB/latest updated!");

  await browser.close();
  console.log("\n✨ All done!");
}

main().catch(console.error);
