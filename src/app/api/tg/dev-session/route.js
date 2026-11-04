import { NextResponse } from "next/server";
import {
  signTelegramInitData,
  telegramDevMockEnabled,
  verifyTelegramInitData,
} from "@/lib/telegramInitData";

const LOCAL_USER = {
  id: 999000001,
  first_name: "Локальный",
  last_name: "Тест",
  username: "local_test",
  language_code: "ru",
};

export async function GET() {
  if (!telegramDevMockEnabled()) {
    return NextResponse.json({ error: "off" }, { status: 404 });
  }
  const initData = signTelegramInitData(LOCAL_USER);
  if (!initData || !verifyTelegramInitData(initData)) {
    return NextResponse.json(
      { error: "Нет BOT_TOKEN в .env — Mini App локально не подписать" },
      { status: 500 }
    );
  }
  return NextResponse.json({
    initData,
    initDataUnsafe: {
      query_id: "local-dev",
      user: LOCAL_USER,
    },
  });
}
