import { prisma } from "./prisma.js";
import { SHOP } from "./shop.js";
import { wantsTelegramReminder } from "./telegramAccount.js";
import { sendTelegram } from "./telegram.js";
import { addDaysISO, bookingStartMs, formatDateTime, todayISO } from "./time.js";

const HOUR_MS = 60 * 60 * 1000;
const FIVE_MS = 5 * 60 * 1000;

export function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function reminderText(booking, kind) {
  const lead =
    kind === "hour"
      ? "Напоминание: через час запись в Craft Barbershop."
      : kind === "five"
        ? "Напоминание: через 5 минут запись в Craft Barbershop."
        : "Напоминание о записи в Craft Barbershop.";
  return [
    lead,
    `${booking.service.name} у ${booking.barber.name}`,
    formatDateTime(booking.date, booking.startMin),
    `${SHOP.city}, ${SHOP.street}`,
  ].join("\n");
}

export async function rememberTelegramClient({ phone, chatId, username } = {}) {
  const id = String(chatId || "");
  const digits = phoneDigits(phone);
  const nick = username ? String(username).replace(/^@/, "").toLowerCase() : "";
  if (!id) return;

  if (digits.length >= 9) {
    await prisma.telegramClient.upsert({
      where: { phoneDigits: digits },
      create: { phoneDigits: digits, chatId: id, username: nick || null },
      update: {
        chatId: id,
        ...(nick ? { username: nick } : {}),
      },
    });
  } else if (nick) {
    const byName = await prisma.telegramClient.findUnique({
      where: { username: nick },
    });
    if (byName) {
      await prisma.telegramClient.update({
        where: { username: nick },
        data: { chatId: id },
      });
    } else {
      await prisma.telegramClient.create({
        data: {
          phoneDigits: `tg:${id}`,
          chatId: id,
          username: nick,
        },
      });
    }
  }

  const open = await prisma.booking.findMany({
    where: {
      telegramChatId: null,
      status: { not: "cancelled" },
    },
  });
  const ids = open
    .filter((booking) => {
      if (booking.source === "telegram" && digits && phoneDigits(booking.phone) === digits) {
        return true;
      }
      return Boolean(nick && booking.telegramUsername === nick);
    })
    .map((booking) => booking.id);
  if (ids.length) {
    await prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { telegramChatId: id },
    });
  }
}

export async function chatIdForUsername(username) {
  const nick = String(username || "")
    .replace(/^@/, "")
    .toLowerCase();
  if (!nick) return null;
  const row = await prisma.telegramClient.findUnique({
    where: { username: nick },
  });
  return row?.chatId || null;
}

export async function sendBookingReminder(booking, kind = "manual") {
  if (!booking || booking.status === "cancelled") {
    return { sent: false, reason: "cancelled" };
  }
  if (!wantsTelegramReminder(booking)) {
    return {
      sent: false,
      reason: "no-telegram",
      error: "Клиент не указал Telegram",
    };
  }
  if (!booking.telegramChatId) {
    return {
      sent: false,
      reason: "no-telegram",
      error: "Клиент ещё не написал боту",
    };
  }

  const result = await sendTelegram(
    booking.telegramChatId,
    reminderText(booking, kind)
  );
  if (!result.sent) {
    return {
      sent: false,
      reason: result.reason,
      error: "Не удалось отправить в Telegram",
    };
  }

  const data =
    kind === "hour"
      ? { remindHourSent: true }
      : kind === "five"
        ? { remindFiveSent: true }
        : {};
  if (Object.keys(data).length) {
    await prisma.booking.update({ where: { id: booking.id }, data });
  }
  return { sent: true };
}

export async function tickReminders() {
  const from = addDaysISO(todayISO(), -1);
  const to = addDaysISO(todayISO(), 1);
  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: from, lte: to },
      status: { not: "cancelled" },
      telegramChatId: { not: null },
      OR: [{ remindHourSent: false }, { remindFiveSent: false }],
    },
    include: { service: true, barber: true },
  });

  const now = Date.now();
  for (const booking of bookings) {
    if (!wantsTelegramReminder(booking)) continue;
    const remaining = bookingStartMs(booking.date, booking.startMin) - now;
    if (remaining < 0 || remaining > HOUR_MS) continue;
    try {
      if (remaining <= FIVE_MS && !booking.remindFiveSent) {
        await sendBookingReminder(booking, "five");
      } else if (!booking.remindHourSent) {
        await sendBookingReminder(booking, "hour");
      }
    } catch (error) {
      console.error("reminder tick", booking.id, error);
    }
  }
}
