import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { telegramConfigured } from "@/lib/telegram";

export async function GET() {
  return NextResponse.json({
    ok: await isAdmin(),
    telegramConfigured: telegramConfigured(),
  });
}
