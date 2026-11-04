import { NextResponse } from "next/server";
import { checkPassword, cookieOptions, signAdmin } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  if (!checkPassword(body.password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const options = cookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(options.name, signAdmin(), options);
  return response;
}
