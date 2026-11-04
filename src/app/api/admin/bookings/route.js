import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayISO } from "@/lib/time";

export async function GET(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayISO();
  const bookings = await prisma.booking.findMany({
    where: { date },
    include: { service: true, barber: true },
    orderBy: [{ startMin: "asc" }],
  });
  return NextResponse.json({ date, bookings });
}
