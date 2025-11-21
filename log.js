const { chromium } = require("playwright");
const fs = require("fs/promises");
const path = require("path");
const prettier = require("prettier");
const { time } = require("console");

// 타임스탬프 문자열에서 날짜 부분만 추출하는 헬퍼 함수
// 예: "今日 18:04" -> "今日"
// 예: "先週 土曜日 17:25" -> "先週 土曜日"
// 예: "2025/09/27 10:00" -> "2025/09/27"
function getDatePart(timestamp) {
  if (!timestamp) return "";
  const parts = timestamp.split(" ");
  // 마지막 요소가 시간(HH:MM)이라고 가정하고 그 앞부분을 모두 반환
  return parts.slice(0, -1).join(" ");
}

(async () => {
  const { default: inquirer } = await import("inquirer");

  const configPath = path.join(process.cwd(), "config.json");
  let config;
  try {
    const configFile = await fs.readFile(configPath, "utf8");
    config = JSON.parse(configFile);
    if (!config.logs || config.logs.length === 0) {
      console.error(`[오류] 'config.json'에 유효한 'logs' 항목이 없습니다.`);
      return;
    }
  } catch (error) {
    console.error(
      `[오류] 'config.json' 파일을 읽거나 파싱하는 데 실패했습니다. 파일이 존재하고 형식이 올바른지 확인해주세요.`,
    );
    return;
  }

  const logChoices = config.logs.map((log) => ({
    name: log.name, // 사용자에게 보여줄 이름
    value: log.path, // 선택 시 반환될 값 (URL)
  }));

  const urlAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedUrl",
      message: "어떤 로그를 가져오시겠습니까?",
      choices: logChoices,
    },
  ]);
  const targetUrl = urlAnswer.selectedUrl;

  const campaignsPath = path.join(process.cwd(), "src", "campaigns");
  let campaignFolders;

  try {
    const dirents = await fs.readdir(campaignsPath, { withFileTypes: true });
    campaignFolders = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch (error) {
    console.error(
      `[오류] 'src/campaigns' 디렉터리를 찾을 수 없습니다. 해당 경로를 생성해주세요.`,
    );
    return; // 스크립트 종료
  }

  if (campaignFolders.length === 0) {
    console.error(
      `[오류] 'src/campaigns' 디렉터리 내에 캠페인 폴더가 하나도 없습니다.`,
    );
    return; // 스크립트 종료
  }

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "campaignFolder",
      message: "어느 캠페인에 로그를 저장하시겠습니까?",
      choices: campaignFolders,
    },
    {
      type: "input",
      name: "filename",
      message:
        "저장할 파일명을 입력하세요 (확장자 .html은 자동으로 추가됩니다):",
      validate: function (input) {
        if (!input) {
          return "파일명은 비워둘 수 없습니다.";
        }
        return true;
      },
    },
  ]);

  // 파일명에 .html이 없으면 추가
  const finalFilename = answers.filename.endsWith(".html")
    ? answers.filename
    : `${answers.filename}.html`;

  // 최종 저장 경로 생성
  const finalPath = path.join(
    campaignsPath,
    answers.campaignFolder,
    "logs",
    finalFilename,
  );

  console.log(`\n[확인] 로그가 다음 경로에 저장됩니다:\n${finalPath}\n`);

  const browser = await chromium.launch({ headless: true }); // headless: true로 설정하면 브라우저 창 없이 실행됩니다.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1920, height: 1040 });

  try {
    console.log("페이지로 이동 중...");
    await page.goto(targetUrl);

    console.log("채팅 목록을 기다리는 중...");
    const chatListSelector = ".MuiList-root";
    await page.waitForSelector(chatListSelector);
    console.log("채팅 목록을 찾았습니다.");

    // 1. 처음 보이는 채팅의 타임스탬프를 가져와 기준 날짜로 설정
    const initialTimestamp = await page.evaluate((selector) => {
      const list = document.querySelector(selector);
      if (!list || !list.children[0]) return null;
      try {
        return list.children[0].children[0].children[0].children[0].children[1]
          .children[0].children[0].innerText;
        // 시스템 메시지는 타임스탬프가 없을 수도 있으니 안전빵으로 5칸 아래 메시지도 봐야 한다면 3번째 children에 [5] 사용
      } catch (e) {
        console.error("초기 타임스탬프를 찾는 데 실패했습니다.", e);
        return null;
      }
    }, chatListSelector);

    if (!initialTimestamp) {
      throw new Error("기준이 되는 초기 타임스탬프를 찾을 수 없습니다.");
    }

    const targetDate = getDatePart(initialTimestamp);
    console.log(`추출할 목표 날짜: ${targetDate}`);

    const chatListHandle = await page.$(chatListSelector);
    if (!chatListHandle) {
      throw new Error("채팅 목록 element를 찾을 수 없습니다.");
    }

    // 2. 다른 날짜가 나타날 때까지 스크롤을 최상단으로 올리는 과정 반복
    while (true) {
      console.log("스크롤을 최상단으로 이동하여 이전 채팅을 로드합니다...");
      const previousScrollHeight = await chatListHandle.evaluate(
        (el) => el.scrollHeight,
      );

      await chatListHandle.click();
      await page.keyboard.press("Home");

      // 새 콘텐츠가 로드될 시간을 줍니다.
      // 더 안정적인 방법은 scrollHeight가 바뀔 때까지 기다리는 것입니다.
      try {
        await page.waitForFunction(
          (args) =>
            document.querySelector(args.selector).scrollHeight >
            args.prevHeight,
          { selector: chatListSelector, prevHeight: previousScrollHeight },
          { timeout: 5000 },
        );
        console.log("새 채팅이 로드되었습니다.");
      } catch (e) {
        console.log(
          "더 이상 로드할 채팅이 없거나 로드에 실패했습니다. 루프를 종료합니다.",
        );
        break;
      }

      // 스크롤 후 최상단 채팅의 타임스탬프 확인
      const currentTopTimestamp = await page.evaluate((selector) => {
        const list = document.querySelector(selector);
        if (!list || !list.children[0]) return null;
        try {
          return list.children[0].children[0].children[0].children[0]
            .children[1].children[0].children[0].innerText;
        } catch (e) {
          return null;
        }
      }, chatListSelector);

      if (!currentTopTimestamp) {
        console.log("상단 채팅에 타임스탬프가 없어 루프를 재시도합니다.");
        continue;
      }

      const currentTopDate = getDatePart(currentTopTimestamp);
      console.log(`현재 최상단 날짜: ${currentTopDate}`);

      // 3. 날짜가 다르면 루프 중단
      if (currentTopDate !== targetDate) {
        console.log("다른 날짜의 채팅을 발견했습니다. 스크롤을 중단합니다.");
        break;
      }
    }

    console.log("기존 Emotion 스타일 태그를 제거합니다...");
    await page.evaluate(() => {
      const styleTag = document.querySelector('head style[data-emotion="css"]');
      styleTag.innerHTML = ".css-15eea9h { display:none }";
    });

    // 스타일 적용을 위한 짧은 대기
    await page.waitForTimeout(5000);

    console.log("브라우저 내에서 로그 정리 후 HTML을 가져옵니다...");
    const cleanedOuterHtml = await page.evaluate(
      (args) => {
        const getDatePart = new Function("return " + args.getDatePartFuncStr)();
        const list = document.querySelector(args.selector);
        if (!list) return "";

        // 1. 목표 날짜와 다른 로그를 DOM에서 제거
        const childrenToRemove = [];
        for (const li of list.children[0].children[0].children) {
          const timestampElem = li.querySelector(
            ".MuiListItemText-primary > span.css-1v2gfp5",
          );
          if (timestampElem && timestampElem.innerText) {
            const rawTimestamp = timestampElem.innerText;
            const messageDate = getDatePart(rawTimestamp);

            // 각 로그에 대한 판단 과정을 브라우저 콘솔에 출력
            console.log(
              `[로그 검사] Raw: "${rawTimestamp}" | Extracted: "${messageDate}" | 비교 결과: ${messageDate !== args.dateToKeep ? "삭제" : "유지"}`,
            );
            if (messageDate !== args.dateToKeep) {
              childrenToRemove.push(li);
            }
          }
        }
        childrenToRemove.forEach((child) => child.remove());

        // 3. 모든 조작이 끝난 후, 정리된 HTML을 반환
        return list.outerHTML;
      },
      {
        selector: chatListSelector,
        dateToKeep: targetDate,
        getDatePartFuncStr: getDatePart.toString(),
      },
    );

    console.log("HTML 콘텐츠를 Prettier로 포맷팅합니다...");

    const formattedHtml = await prettier.format(cleanedOuterHtml, {
      parser: "html", // HTML 파서를 사용하도록 명시
      htmlWhitespaceSensitivity: "strict",
      printWidth: 140,
    });

    console.log("HTML 시작 및 끝 태그를 수정합니다...");
    const newOpeningTags = `<div class="chat-log" style="background: #202020">
  <div style="height: auto; width: 100%; position: relative;">
    <div>`;

    // 정규식을 사용하여 문자열 시작 부분의 첫 3개 태그를 교체합니다.
    // \s* 는 태그 사이의 공백이나 줄바꿈을 포함합니다.
    let modifiedHtml = formattedHtml.replace(
      /^<[^>]+>\s*<[^>]+>\s*<[^>]+>/,
      newOpeningTags,
    );

    // 문자열의 마지막 '</ul>'를 '</div>'로 교체합니다.
    const lastClosingTagIndex = modifiedHtml.lastIndexOf("</ul>");
    if (lastClosingTagIndex !== -1) {
      modifiedHtml = modifiedHtml.substring(0, lastClosingTagIndex) + "</div>";
    } else {
      // 혹시 모를 경우를 대비한 경고 메시지
      console.warn(
        "경고: 마지막 </ul> 태그를 찾지 못했습니다. 파일이 깨졌을 수 있습니다.",
      );
    }

    // 5. 결과물을 파일로 저장
    await fs.mkdir(path.dirname(finalPath), { recursive: true });

    await fs.writeFile(finalPath, modifiedHtml);
    console.log(`\n[성공] 성공적으로 '${finalFilename}' 파일에 저장했습니다.`);
  } catch (error) {
    console.error("오류가 발생했습니다:", error);
  } finally {
    await browser.close();
  }
})();
