import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "craft_session";

function secret() {
  return process.env.AUTH_SECRET || "craft-dev-secret";
}

export function signAdmin() {
  return createHmac("sha256", secret()).update("craft-admin").digest("hex");
}

export function verifyAdminToken(token) {
  if (!token) return false;
  const expected = signAdmin();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(COOKIE)?.value);
}

export function cookieOptions() {
  return {
    name: COOKIE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || "craft-admin";
  const a = Buffer.from(String(password || ""));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
