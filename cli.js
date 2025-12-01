const inquirer = require("inquirer");
const { exec } = require("child_process");

const choices = [
  { name: "배포하기 (npm run deploy)", value: "npm run deploy" },
  { name: "로그 스크립트 실행 (node log.js)", value: "node log.js" },
  { name: "다운로드 스크립트 실행 (node download.js)", value: "node download.js" },
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
