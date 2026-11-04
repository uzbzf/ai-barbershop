import { formatDateTime } from "./time.js";

export function telegramConfigured() {
  return Boolean(process.env.BOT_TOKEN && process.env.GROUP_CHAT_ID);
}

export function botToken() {
  return String(process.env.BOT_TOKEN || "").trim();
}

export async function sendTelegram(chatId, text) {
  const token = botToken();
  if (!token || !chatId) return { sent: false, reason: "not-configured" };

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Telegram send failed", body);
    return { sent: false, reason: "telegram-error", body };
  }
  return { sent: true };
}

export function bookingMessage(booking) {
  const source = booking.source === "telegram" ? "Telegram" : "сайт";
  return [
    `Новая запись · ${source}`,
    `Клиент: ${booking.clientName}`,
    `Телефон: ${booking.phone}`,
    `Барбер: ${booking.barber.name}`,
    `Услуга: ${booking.service.name}`,
    `Когда: ${formatDateTime(booking.date, booking.startMin)}`,
  ].join("\n");
}

export async function notifyGroup(booking) {
  if (!telegramConfigured()) return { sent: false, reason: "not-configured" };

  return sendTelegram(process.env.GROUP_CHAT_ID, bookingMessage(booking));
}
