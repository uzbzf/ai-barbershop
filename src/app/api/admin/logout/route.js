import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth";

export async function POST() {
  const options = cookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(options.name, "", { ...options, maxAge: 0 });
  return response;
}
