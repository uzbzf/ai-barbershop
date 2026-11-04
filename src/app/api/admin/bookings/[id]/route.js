import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = new Set(["new", "confirmed", "cancelled"]);

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  if (!STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
  }
  const booking = await prisma.booking.update({
    where: { id },
    data: { status: body.status },
    include: { service: true, barber: true },
  });
  return NextResponse.json({ booking });
}
