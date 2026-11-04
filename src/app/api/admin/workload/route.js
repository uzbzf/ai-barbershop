import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDaysISO, mondayOfWeek, todayISO, weekdayOf } from "@/lib/time";

export async function GET(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart") || mondayOfWeek(todayISO());
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));

  const barbers = await prisma.barber.findMany({
    include: { hours: true },
    orderBy: { name: "asc" },
  });
  const bookings = await prisma.booking.findMany({
    where: {
      date: { in: days },
      status: { not: "cancelled" },
    },
    include: { service: true },
  });

  const todayStats = barbers.map((barber) => {
    const hour = barber.hours.find((item) => item.weekday === weekdayOf(today));
    const workMin =
      !hour || hour.isOff ? 0 : Math.max(0, hour.endMin - hour.startMin);
    const bookedMin = bookings
      .filter((b) => b.barberId === barber.id && b.date === today)
      .reduce((sum, b) => sum + b.service.durationMin, 0);
    const pct = workMin ? Math.min(100, Math.round((bookedMin / workMin) * 100)) : 0;
    return {
      id: barber.id,
      name: barber.name,
      initials: barber.initials,
      accent: barber.accent,
      active: barber.active,
      workMin,
      bookedMin,
      pct,
      isOff: !hour || hour.isOff,
    };
  });

  const hours = [];
  for (let h = 9; h <= 21; h += 1) hours.push(h);

  const grid = days.map((date) => ({
    date,
    rows: barbers.map((barber) => {
      const hour = barber.hours.find((item) => item.weekday === weekdayOf(date));
      const dayBookings = bookings.filter(
        (b) => b.barberId === barber.id && b.date === date
      );
      const cells = hours.map((h) => {
        const start = h * 60;
        const end = start + 60;
        const busy = dayBookings.some((b) => {
          const bEnd = b.startMin + b.service.durationMin;
          return b.startMin < end && start < bEnd;
        });
        const working =
          hour && !hour.isOff && start >= hour.startMin && start < hour.endMin;
        return { hour: h, busy, working };
      });
      return {
        id: barber.id,
        name: barber.name,
        initials: barber.initials,
        isOff: !hour || hour.isOff,
        cells,
      };
    }),
  }));

  return NextResponse.json({ weekStart, today, hours, todayStats, grid });
}
