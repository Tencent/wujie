/**
 * 集成测试启动前释放 jest-puppeteer.config.js 里占用的端口。
 * jest-dev-server 的 usedPortAction: "kill" 依赖 find-process，在 macOS 上常查不到监听进程会报错。
 */
const { execSync } = require("child_process");

/** 与 jest-puppeteer.config.js 中 server[].port 保持一致 */
const INTEGRATION_PORTS = [7600, 7100, 7200, 7300, 7500, 7400, 7700, 8000];

function execQuiet(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** @returns {string[]} */
function getListenerPidsOnPort(port) {
  const platform = process.platform;

  if (platform === "win32") {
    try {
      const stdout = execQuiet(`netstat -ano | findstr :${port}`);
      const pids = stdout
        .split("\n")
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length >= 5 && parts[3] === "LISTENING")
        .map((parts) => parts[parts.length - 1]);
      return [...new Set(pids.filter(Boolean))];
    } catch {
      return [];
    }
  }

  // macOS / Linux / 其他类 Unix：优先 lsof
  try {
    const stdout = execQuiet(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`);
    return [...new Set(stdout.split("\n").filter(Boolean))];
  } catch {
    /* lsof 未安装或 -s 语法不支持时走 Linux 常见兜底 */
  }

  if (platform === "linux") {
    try {
      // fuser 在多数 Linux 发行版默认可用
      const stdout = execQuiet(`fuser -n tcp ${port} 2>/dev/null`);
      return [...new Set(stdout.split(/\s+/).filter(Boolean))];
    } catch {
      /* ignore */
    }

    try {
      // ss 常见于 util-linux，输出形如 users:(("node",pid=12345,fd=20))
      const stdout = execQuiet(`ss -H -ltnp sport = :${port}`);
      const pids = [...stdout.matchAll(/pid=(\d+)/g)].map((m) => m[1]);
      return [...new Set(pids)];
    } catch {
      return [];
    }
  }

  return [];
}

function killListenersOnPort(port) {
  const pids = getListenerPidsOnPort(port);
  pids.forEach((pid) => {
    try {
      process.kill(Number(pid), "SIGTERM");
      console.log(`[kill-integration-ports] SIGTERM pid=${pid} port=${port}`);
    } catch (error) {
      if (error.code !== "ESRCH") {
        console.warn(`[kill-integration-ports] failed pid=${pid} port=${port}:`, error.message);
      }
    }
  });
}

function delay(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* 跨平台等待端口释放，避免依赖 shell 的 sleep */
  }
}

INTEGRATION_PORTS.forEach(killListenersOnPort);
delay(500);
