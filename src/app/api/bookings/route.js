import { NextResponse } from "next/server";
import { rememberTelegramClient } from "@/lib/reminders";
import { createBooking } from "@/lib/slots";
import { notifyGroup } from "@/lib/telegram";
import { verifyTelegramInitData } from "@/lib/telegramInitData";

export async function POST(request) {
  try {
    const body = await request.json();
    const initData =
      request.headers.get("x-telegram-init-data") || body.initData || "";
    if (initData) {
      const user = verifyTelegramInitData(initData);
      if (!user?.id) {
        return NextResponse.json(
          { error: "Откройте запись из Telegram" },
          { status: 401 }
        );
      }
      const booking = await createBooking({
        serviceId: body.serviceId,
        barberId: body.barberId,
        date: body.date,
        startMin: body.startMin,
        clientName: body.clientName,
        phone: body.phone,
        source: "telegram",
        telegramChatId: String(user.id),
        telegramUsername: user.username || "",
      });
      await rememberTelegramClient({
        phone: booking.phone,
        chatId: user.id,
        username: user.username,
      });
      await notifyGroup(booking);
      return NextResponse.json({
        id: booking.id,
        date: booking.date,
        startMin: booking.startMin,
      });
    }

    const booking = await createBooking({
      serviceId: body.serviceId,
      barberId: body.barberId,
      date: body.date,
      startMin: body.startMin,
      clientName: body.clientName,
      phone: body.phone,
      source: "site",
      telegramUsername: body.telegramUsername || "",
    });
    await notifyGroup(booking);
    return NextResponse.json({
      id: booking.id,
      date: booking.date,
      startMin: booking.startMin,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Не удалось записаться" },
      { status: 400 }
    );
  }
}
