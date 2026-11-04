import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingReminder } from "@/lib/reminders";

export async function POST(_request, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { service: true, barber: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }
  const result = await sendBookingReminder(booking, "manual");
  if (!result.sent) {
    return NextResponse.json(
      { error: result.error || "Не удалось отправить напоминание" },
      { status: 400 }
    );
  }
  return NextResponse.json({ sent: true });
}
