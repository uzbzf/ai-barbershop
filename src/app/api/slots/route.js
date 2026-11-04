import { NextResponse } from "next/server";
import { getFreeSlots } from "@/lib/slots";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");
  if (!barberId || !serviceId || !date) {
    return NextResponse.json({ slots: [] });
  }
  const slots = await getFreeSlots(barberId, serviceId, date);
  return NextResponse.json({ slots });
}
