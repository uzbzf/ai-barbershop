import { NextResponse } from "next/server";
import { catalog, getFreeSlots } from "@/lib/slots";
import { todayISO, weekdayOf } from "@/lib/time";

export async function GET() {
  const data = await catalog();
  const today = todayISO();
  const weekday = weekdayOf(today);
  const haircut =
    data.services.find((s) => s.name === "Стрижка") || data.services[0];

  const freeToday = [];
  for (const barber of data.barbers) {
    const hour = barber.hours.find((item) => item.weekday === weekday);
    if (!hour || hour.isOff) continue;
    const slots = haircut
      ? await getFreeSlots(barber.id, haircut.id, today)
      : [];
    freeToday.push({
      id: barber.id,
      name: barber.name,
      specialty: barber.specialty,
      initials: barber.initials,
      accent: barber.accent,
      slotsLeft: slots.length,
    });
  }

  const telegramReady = Boolean(
    process.env.BOT_TOKEN && process.env.GROUP_CHAT_ID
  );

  return NextResponse.json({
    ...data,
    freeToday,
    telegramReady,
    today,
  });
}
