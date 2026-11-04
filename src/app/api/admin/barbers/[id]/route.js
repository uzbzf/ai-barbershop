import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.specialty != null) data.specialty = String(body.specialty).trim();
  if (body.bio != null) data.bio = String(body.bio).trim();
  if (body.initials != null) data.initials = String(body.initials).slice(0, 3);
  if (body.accent != null) data.accent = body.accent;
  if (body.active != null) data.active = Boolean(body.active);

  if (Array.isArray(body.hours)) {
    await prisma.workingHour.deleteMany({ where: { barberId: id } });
    data.hours = {
      create: body.hours.map((hour) => ({
        weekday: hour.weekday,
        startMin: Number(hour.startMin),
        endMin: Number(hour.endMin),
        isOff: Boolean(hour.isOff),
      })),
    };
  }

  const barber = await prisma.barber.update({
    where: { id },
    data,
    include: { hours: { orderBy: { weekday: "asc" } } },
  });
  return NextResponse.json({ barber });
}
