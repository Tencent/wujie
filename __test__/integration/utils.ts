const fs = require("fs");
const path = require("path");
const http = require("http");
let server = null;
type Page = typeof page;
export function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function initEnv() {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("Hello, World!");
  });
  server.listen(3000);
}

export function cleanEnv() {
  server?.close();
}

export function appFetch(url: string): Promise<Response> {
  const filePath = path.join(__dirname, url.replace("http://", "./apps/"));
  const data = fs.readFileSync(filePath, "utf8");

  return Promise.resolve(new Response(data));
}

export async function awaitConsoleLogMessage(page: Page, message: string): Promise<void> {
  await new Promise<void>((resolve) => {
    page.on("console", (msg) => {
      // 完成渲染
      if (msg.text() === message) {
        resolve();
      }
    });
  });
}

export async function getTextContentByJsSelector(page: Page, selector: string): Promise<string> {
  const element = await page.evaluateHandle(selector);
  return await element.asElement().evaluate((el) => el.textContent);
}

export async function getClassListByJsSelector(page: Page, selector: string): Promise<Array<string>> {
  const element = await page.evaluateHandle(selector);
  const classList = await element.asElement().evaluate((el) => el.classList);
  return Object.entries(classList).map((item) => item[1]);
}

export async function triggerClickByJsSelector(page: Page, selector: string): Promise<void> {
  const element = await page.evaluateHandle(selector);
  return element.asElement().click();
}

type SearchMap = {
  react16: string;
  react17: string;
  vue2: string;
  vue3: string;
  vite: string;
  angular12: string;
};

export function getUrlSearchObject(url: string): SearchMap {
  let search = new URL(url).search.replace("?", "");
  let urlObj = {};
  search.split("&").forEach((query) => {
    let params = query.split("=");
    urlObj[params[0]] = params[1];
  });
  return urlObj as SearchMap;
}
