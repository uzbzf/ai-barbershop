import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHours } from "@/lib/time";

function initialsFrom(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const barbers = await prisma.barber.findMany({
    include: { hours: { orderBy: { weekday: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ barbers });
}

export async function POST(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Укажите имя барбера" }, { status: 400 });
  }
  const hours = Array.isArray(body.hours) ? body.hours : defaultHours();
  const barber = await prisma.barber.create({
    data: {
      name,
      specialty: String(body.specialty || "").trim() || "мастер",
      bio: String(body.bio || "").trim() || "Новый мастер зала.",
      initials: String(body.initials || initialsFrom(name)).slice(0, 3),
      accent: body.accent || "#8C6A3D",
      active: body.active !== false,
      hours: {
        create: hours.map((hour) => ({
          weekday: hour.weekday,
          startMin: Number(hour.startMin),
          endMin: Number(hour.endMin),
          isOff: Boolean(hour.isOff),
        })),
      },
    },
    include: { hours: true },
  });
  return NextResponse.json({ barber });
}
