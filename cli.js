const inquirer = require("inquirer");
const { exec } = require("child_process");

const choices = [
  { name: "배포하기 (npm run deploy)", value: "npm run deploy" },
  { name: "로그 다운로드 (node log.js)", value: "node log.js" },
  { name: "로그 일괄 다운로드 (node download.js)", value: "node download.js" },
  { name: "지식 베이스 파일 생성 (node KB.js)", value: "node KB.js" },
  { name: "지식 베이스 업데이트 (node update.js)", value: "node update.js" },
];

inquirer
  .createPromptModule()([
    {
      type: "list",
      name: "command",
      message: "어떤 작업을 실행할까요?",
      choices,
    },
  ])
  .then(({ command }) => {
    console.log(`▶ 명령 실행: ${command}`);
    const child = exec(command);

    child.stdout.on("data", (data) => console.log(data));
    child.stderr.on("data", (data) => console.error(data));
    child.on("close", (code) => console.log(`종료 코드: ${code}`));
  })
  .catch(console.error);
