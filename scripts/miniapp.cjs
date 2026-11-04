const { spawn } = require("child_process");
const http = require("http");
const net = require("net");
const path = require("path");

const root = path.join(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const page = `http://localhost:${port}/tg`;

function portOpen(checkPort) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port: checkPort }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

function waitHttp(url, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Сайт не поднялся: ${url}`));
          return;
        }
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function run(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code) process.exit(code);
  });
  return child;
}

function openBrowser(url) {
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  spawn(command, { cwd: root, shell: true, stdio: "ignore", detached: true });
}

async function main() {
  if (!(await portOpen(port))) {
    console.log(`Стартую сайт на порту ${port}…`);
    run("npm", ["run", "dev"]);
  } else {
    console.log(`Сайт уже запущен: http://localhost:${port}`);
  }

  await waitHttp(page);
  openBrowser(page);

  console.log("");
  console.log("Mini App локально:");
  console.log(`  ${page}`);
  console.log("Это тот же экран, что откроется в Telegram.");
  console.log("Запись из него попадает в журнал как из Mini App.");
  console.log("В боте после /start есть ссылка «Проверить Mini App локально».");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
