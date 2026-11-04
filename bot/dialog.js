import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
import { prisma } from "../src/lib/prisma.js";
import { createBooking, getFreeSlots } from "../src/lib/slots.js";
import { rememberTelegramClient, tickReminders } from "../src/lib/reminders.js";
import { notifyGroup } from "../src/lib/telegram.js";
import {
  localMiniAppUrl,
  telegramWebAppUrl,
} from "../src/lib/telegramInitData.js";
import {
  addDaysISO,
  formatLongDate,
  minutesToTime,
  todayISO,
  weekdayOf,
} from "../src/lib/time.js";

const sessions = new Map();

function sessionOf(id) {
  if (!sessions.has(id)) sessions.set(id, { step: "idle" });
  return sessions.get(id);
}

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function uid(ctx) {
  return ctx.from?.id || ctx.chat.id;
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

async function show(ctx, text, keyboard) {
  const extra = keyboard ? { reply_markup: keyboard } : undefined;
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, extra);
      return;
    }
  } catch (error) {
    console.warn("editMessageText failed, sending new message", error.message);
  }
  await ctx.reply(text, extra);
}

async function linkTelegram(ctx, phone) {
  await rememberTelegramClient({
    phone,
    chatId: uid(ctx),
    username: ctx.from?.username,
  });
}

async function openStart(ctx) {
  await linkTelegram(ctx);
  const url = telegramWebAppUrl();
  const local = localMiniAppUrl();
  const keyboard = new InlineKeyboard();
  if (url) {
    keyboard.webApp("Открыть календарь", url).row();
  } else {
    keyboard.url("Проверить Mini App локально", local).row();
  }
  keyboard.text("Записаться в чате", "chat");
  await ctx.reply(
    url
      ? "Craft Barbershop. Запись через Mini App — календарь и свободные окна мастера."
      : `Craft Barbershop.\nПока сайт локальный, Mini App можно открыть на этом компьютере:\n${local}`,
    { reply_markup: keyboard }
  );
}

async function startBooking(ctx) {
  const state = sessionOf(uid(ctx));
  state.step = "service";
  state.services = await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
  });
  if (!state.services.length) {
    await ctx.reply(
      "Услуги ещё не добавлены. Загляните позже или запишитесь на сайте."
    );
    return;
  }
  const keyboard = new InlineKeyboard();
  state.services.forEach((service, index) => {
    keyboard.text(`${service.name} · ${service.price}₽`, `s:${index}`).row();
  });
  await ctx.reply("Craft Barbershop. Выберите услугу.", {
    reply_markup: keyboard,
  });
}

async function main() {
  const token = String(process.env.BOT_TOKEN || "").trim();
  if (!token) {
    console.log("BOT_TOKEN пустой. Бот не запущен, сайт работает без него.");
    process.exit(0);
  }

  const bot = new Bot(token);

  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Telegram API", e.description);
    } else if (e instanceof HttpError) {
      console.error("Telegram HTTP", e);
    } else {
      console.error("Bot error", e);
    }
  });

  bot.command("start", async (ctx) => {
    await openStart(ctx);
  });

  bot.command("cancel", async (ctx) => {
    sessions.delete(uid(ctx));
    await ctx.reply("Запись сброшена. /start — начать заново.");
  });

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const state = sessionOf(uid(ctx));
    try {
      await ctx.answerCallbackQuery();
    } catch (_) {
      /* already answered */
    }

    try {
      if (data === "chat") {
        await startBooking(ctx);
        return;
      }

      if (data.startsWith("s:")) {
        const index = Number(data.slice(2));
        if (!state.services) {
          state.services = await prisma.service.findMany({
            orderBy: { sortOrder: "asc" },
          });
        }
        const service = state.services[index];
        if (!service) {
          await show(ctx, "Услуга не найдена. /start — заново.");
          return;
        }
        state.serviceId = service.id;
        state.step = "barber";
        state.barbers = await prisma.barber.findMany({
          where: { active: true },
          include: { hours: true },
          orderBy: { name: "asc" },
        });
        if (!state.barbers.length) {
          await show(ctx, "Сейчас нет активных барберов. /start позже.");
          return;
        }
        const keyboard = new InlineKeyboard();
        state.barbers.forEach((barber, i) => {
          keyboard.text(barber.name, `b:${i}`).row();
        });
        await show(ctx, "К кому сесть?", keyboard);
        return;
      }

      if (data.startsWith("b:")) {
        const index = Number(data.slice(2));
        if (!state.barbers) {
          state.barbers = await prisma.barber.findMany({
            where: { active: true },
            include: { hours: true },
            orderBy: { name: "asc" },
          });
        }
        const barber = state.barbers[index];
        if (!barber) {
          await show(ctx, "Барбер не найден. /start — заново.");
          return;
        }
        state.barberId = barber.id;
        state.step = "day";
        const today = todayISO();
        state.days = [];
        for (let i = 0; i < 14; i += 1) {
          const date = addDaysISO(today, i);
          const hour = barber.hours.find(
            (item) => item.weekday === weekdayOf(date)
          );
          if (!hour || hour.isOff) continue;
          state.days.push(date);
        }
        if (!state.days.length) {
          await show(
            ctx,
            "У этого мастера нет рабочих дней в ближайшие две недели. /start — выбрать другого."
          );
          return;
        }
        const keyboard = new InlineKeyboard();
        state.days.forEach((date, i) => {
          keyboard.text(formatLongDate(date), `d:${i}`).row();
        });
        await show(ctx, "Выберите день:", keyboard);
        return;
      }

      if (data.startsWith("d:")) {
        const index = Number(data.slice(2));
        const date = state.days?.[index];
        if (!date || !state.barberId || !state.serviceId) {
          await show(ctx, "Сессия сбросилась. /start — заново.");
          return;
        }
        state.date = date;
        state.step = "time";
        state.slots = await getFreeSlots(state.barberId, state.serviceId, date);
        if (!state.slots.length) {
          await show(
            ctx,
            `На ${formatLongDate(date)} свободных окон нет. /start — другой день.`
          );
          return;
        }
        const keyboard = new InlineKeyboard();
        chunk(state.slots, 3).forEach((row) => {
          row.forEach((slot) => {
            const i = state.slots.indexOf(slot);
            keyboard.text(minutesToTime(slot), `t:${i}`);
          });
          keyboard.row();
        });
        await show(ctx, `Время на ${formatLongDate(date)}:`, keyboard);
        return;
      }

      if (data.startsWith("t:")) {
        const index = Number(data.slice(2));
        const slot = state.slots?.[index];
        if (slot == null) {
          await show(ctx, "Это время уже недоступно. /start — заново.");
          return;
        }
        state.startMin = slot;
        state.step = "name";
        await show(ctx, "Напишите имя, как к вам обращаться.");
        return;
      }

      if (data === "ok") {
        if (!state.clientName || !state.phone) {
          await show(ctx, "Не хватает имени или телефона. /start — заново.");
          return;
        }
        await linkTelegram(ctx, state.phone);
        const created = await createBooking({
          serviceId: state.serviceId,
          barberId: state.barberId,
          date: state.date,
          startMin: state.startMin,
          clientName: state.clientName,
          phone: state.phone,
          source: "telegram",
          telegramChatId: String(uid(ctx)),
          telegramUsername: ctx.from?.username || "",
        });
        try {
          await notifyGroup(created);
        } catch (error) {
          console.error("notifyGroup", error);
        }
        sessions.delete(uid(ctx));
        await show(
          ctx,
          `Готово. ${created.service.name}, ${created.barber.name}, ${formatLongDate(created.date)} в ${minutesToTime(created.startMin)}.`
        );
        await ctx.reply("Если нужна ещё одна запись — /start.", {
          reply_markup: { remove_keyboard: true },
        });
      }
    } catch (error) {
      console.error("callback", error);
      await show(
        ctx,
        `${error.message || "Не получилось записать"}. /start — заново.`
      );
    }
  });

  async function takePhone(ctx, rawPhone, fallbackName) {
    const state = sessionOf(uid(ctx));
    if (state.step !== "phone" && state.step !== "name") return false;
    if (state.step === "name" && fallbackName && !state.clientName) {
      state.clientName = fallbackName;
    }
    if (digits(rawPhone).length < 9) {
      await ctx.reply(
        "Нужен номер, минимум 9 цифр. Или отправьте контакт кнопкой."
      );
      return true;
    }
    state.phone = rawPhone.trim();
    await linkTelegram(ctx, state.phone);
    const [service, barber] = await Promise.all([
      prisma.service.findUnique({ where: { id: state.serviceId } }),
      prisma.barber.findUnique({ where: { id: state.barberId } }),
    ]);
    if (!service || !barber) {
      await ctx.reply("Сессия сбросилась. /start — заново.");
      return true;
    }
    const keyboard = new InlineKeyboard().text("Подтвердить", "ok");
    state.step = "confirm";
    await ctx.reply(
      `${state.clientName}, ${service.name} у ${barber.name}, ${formatLongDate(state.date)} в ${minutesToTime(state.startMin)}. Телефон ${state.phone}.`,
      { reply_markup: keyboard }
    );
    return true;
  }

  bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const state = sessionOf(uid(ctx));
    if (state.step === "name" && !state.clientName) {
      state.clientName =
        [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
        "Клиент";
      state.step = "phone";
    }
    await takePhone(
      ctx,
      contact.phone_number,
      [contact.first_name, contact.last_name].filter(Boolean).join(" ")
    );
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    const state = sessionOf(uid(ctx));
    if (state.step === "name") {
      const name = ctx.message.text.trim();
      if (name.length < 2) {
        await ctx.reply("Напишите имя полностью.");
        return;
      }
      state.clientName = name;
      state.step = "phone";
      await ctx.reply(
        "Телефон для подтверждения. Можно просто написать номер.",
        {
          reply_markup: {
            keyboard: [[{ text: "Отправить контакт", request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return;
    }
    if (state.step === "phone") {
      await takePhone(ctx, ctx.message.text);
      return;
    }
    await ctx.reply("Чтобы записаться, нажмите /start.");
  });

  setInterval(() => {
    tickReminders().catch((error) => console.error("reminders", error));
  }, 20000);
  tickReminders().catch((error) => console.error("reminders", error));

  const miniApp = telegramWebAppUrl();
  if (miniApp) {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "Запись",
        web_app: { url: miniApp },
      },
    });
    console.log(`Mini App: ${miniApp}`);
  } else {
    await bot.api.setChatMenuButton({
      menu_button: { type: "default" },
    });
    console.log(
      "Mini App выключен: задайте TELEGRAM_WEBAPP_URL=https://ваш-домен"
    );
  }

  await bot.api.deleteWebhook({ drop_pending_updates: false });
  await bot.start({
    onStart: (info) =>
      console.log(`Craft Barbershop bot polling as @${info.username}`),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
