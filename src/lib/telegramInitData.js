import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SEC = 60 * 60 * 24;

function dataCheckString(params) {
  return [...params.keys()]
    .sort()
    .map((key) => `${key}=${params.get(key)}`)
    .join("\n");
}

function secretKey(botToken) {
  return createHmac("sha256", "WebAppData").update(botToken).digest();
}

export function signTelegramInitData(user, botToken = process.env.BOT_TOKEN) {
  const token = String(botToken || "").trim();
  if (!token) return "";
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "local-dev",
    user: JSON.stringify(user),
  });
  const hash = createHmac("sha256", secretKey(token))
    .update(dataCheckString(params))
    .digest("hex");
  params.set("hash", hash);
  return params.toString();
}

export function verifyTelegramInitData(initData, botToken = process.env.BOT_TOKEN) {
  const raw = String(initData || "").trim();
  const token = String(botToken || "").trim();
  if (!raw || !token) return null;

  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const digest = createHmac("sha256", secretKey(token))
    .update(dataCheckString(params))
    .digest("hex");
  const left = Buffer.from(digest, "hex");
  const right = Buffer.from(hash, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > MAX_AGE_SEC) return null;

  try {
    return JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
}

export function telegramWebAppUrl() {
  const raw = String(process.env.TELEGRAM_WEBAPP_URL || "").trim();
  if (!raw) return "";
  const url = raw.replace(/\/$/, "");
  const href = url.endsWith("/tg") ? url : `${url}/tg`;
  if (!href.startsWith("https://")) return "";
  return href;
}

export function localMiniAppUrl() {
  return String(
    process.env.TELEGRAM_MINIAPP_LOCAL_URL || "http://localhost:3000/tg"
  ).trim();
}

export function telegramDevMockEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_TG_DEV_MOCK === "1"
  );
}
