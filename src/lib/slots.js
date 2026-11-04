import { prisma } from "./prisma.js";
import { chatIdForUsername } from "./reminders.js";
import { normalizeTelegramUsername } from "./telegramAccount.js";
import { overlaps, weekdayOf } from "./time.js";

export function buildSlots(startMin, endMin, durationMin, bookings) {
  const slots = [];
  for (let t = startMin; t + durationMin <= endMin; t += durationMin) {
    const taken = bookings.some((booking) =>
      overlaps(t, durationMin, booking.startMin, booking.durationMin)
    );
    if (!taken) slots.push(t);
  }
  return slots;
}

export async function getBookedBlocks(barberId, date) {
  const bookings = await prisma.booking.findMany({
    where: {
      barberId,
      date,
      status: { not: "cancelled" },
    },
    include: { service: true },
  });
  return bookings.map((booking) => ({
    id: booking.id,
    startMin: booking.startMin,
    durationMin: booking.service.durationMin,
    clientName: booking.clientName,
    serviceName: booking.service.name,
    status: booking.status,
  }));
}

export async function getFreeSlots(barberId, serviceId, date) {
  const [barber, service] = await Promise.all([
    prisma.barber.findUnique({
      where: { id: barberId },
      include: { hours: true },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);

  if (!barber?.active || !service) return [];

  const hour = barber.hours.find((item) => item.weekday === weekdayOf(date));
  if (!hour || hour.isOff) return [];

  const bookings = await getBookedBlocks(barberId, date);
  return buildSlots(hour.startMin, hour.endMin, service.durationMin, bookings);
}

export async function createBooking({
  serviceId,
  barberId,
  date,
  startMin,
  clientName,
  phone,
  source,
  telegramChatId,
  telegramUsername,
}) {
  const name = String(clientName || "").trim();
  const tel = String(phone || "").trim();
  if (!name || name.length < 2) {
    throw new Error("Укажите имя");
  }
  if (tel.replace(/\D/g, "").length < 9) {
    throw new Error("Укажите телефон");
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { hours: true },
  });
  if (!service || !barber?.active) {
    throw new Error("Барбер или услуга недоступны");
  }

  const hour = barber.hours.find((item) => item.weekday === weekdayOf(date));
  if (!hour || hour.isOff) {
    throw new Error("В этот день барбер не работает");
  }
  if (
    startMin < hour.startMin ||
    startMin + service.durationMin > hour.endMin
  ) {
    throw new Error("Время вне графика барбера");
  }

  const today = new Date();
  const [y, m, d] = date.split("-").map(Number);
  const chosen = new Date(y, m - 1, d, 23, 59, 59);
  if (chosen < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    throw new Error("Нельзя записаться на прошедший день");
  }

  const bookings = await getBookedBlocks(barberId, date);
  const clash = bookings.some((booking) =>
    overlaps(startMin, service.durationMin, booking.startMin, booking.durationMin)
  );
  if (clash) {
    throw new Error("Это время уже занято");
  }

  const username = normalizeTelegramUsername(telegramUsername || "") || null;

  let chatId = null;
  if (source === "telegram") {
    chatId =
      telegramChatId != null && String(telegramChatId)
        ? String(telegramChatId)
        : null;
  } else if (username) {
    chatId = await chatIdForUsername(username);
  }

  return prisma.booking.create({
    data: {
      clientName: name,
      phone: tel,
      serviceId,
      barberId,
      date,
      startMin,
      source,
      status: "new",
      telegramChatId: chatId || null,
      telegramUsername: username,
    },
    include: { service: true, barber: true },
  });
}

export async function catalog() {
  const [services, barbers] = await Promise.all([
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.barber.findMany({
      where: { active: true },
      include: { hours: { orderBy: { weekday: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return { services, barbers };
}
