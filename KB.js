const fs = require("fs-extra");
const path = require("path");

const baseDir = path.resolve("experiment");

async function main() {
  const { default: inquirer } = await import("inquirer");

  // experiment 폴더 내의 디렉터리 목록 가져오기
  const folders = fs
    .readdirSync(baseDir)
    .filter((file) => fs.statSync(path.join(baseDir, file)).isDirectory());

  if (folders.length === 0) {
    console.error("experiment 폴더 아래에 하위 폴더가 없습니다.");
    return;
  }

  // inquirer로 하위 폴더 선택
  const { name } = await inquirer.prompt([
    {
      type: "list",
      name: "name",
      message: "대상 폴더를 선택하세요:",
      choices: folders,
    },
  ]);

  const targetKBDir = path.join(baseDir, name, "KB", "latest");
  const outputFilePath = path.join(baseDir, name, "KB.txt");

  const subDirs = {
    HIS: [
      "episodes",
      "characters",
    ],
    S3: [
      "episodes",
      "nations",
      "locations",
      "religions",
      "races",
      "characters",
      "lore",
    ],
  };

  let output = `**지식 베이스(KB) 내용:**\n\n`;

  for (const subDir of subDirs[name]) {
    const fullDir = path.join(targetKBDir, subDir);

    if (!fs.existsSync(fullDir)) continue;

    const files = fs
      .readdirSync(fullDir)
      .filter((file) => fs.statSync(path.join(fullDir, file)).isFile())
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const file of files) {
      const filePath = path.join(fullDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      output += `---\n\n${subDir}/${file}\n\n${content}\n`;
    }
  }

  fs.writeFileSync(outputFilePath, output, "utf-8");
  console.log(`KB.txt 생성 완료: ${outputFilePath}`);
}

main().catch(console.error);
