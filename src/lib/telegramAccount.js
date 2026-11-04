export function normalizeTelegramUsername(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "");
  if (!raw) return "";
  if (!/^[A-Za-z0-9_]{5,32}$/.test(raw)) {
    throw new Error("Укажите Telegram как @username");
  }
  return raw.toLowerCase();
}

export function wantsTelegramReminder(booking) {
  if (!booking || booking.status === "cancelled") return false;
  if (booking.source === "telegram") return true;
  return Boolean(booking.telegramUsername);
}
