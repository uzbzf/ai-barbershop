"use client";

import { wantsTelegramReminder } from "@/lib/telegramAccount";
import { minutesToTime } from "@/lib/time";

const STATUS = {
  new: "новая",
  confirmed: "подтверждена",
  cancelled: "отменена",
};

export default function BookingsPanel({
  date,
  bookings,
  onDate,
  onStatus,
  onRemind,
  remindingId,
}) {
  return (
    <section className="card mt-8 p-6">
      <label className="text-sm text-[var(--muted)]">
        День
        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="input ml-3 inline-block w-auto"
        />
      </label>
      <ul className="mt-6 space-y-3">
        {bookings.length === 0 && (
          <li className="py-6 text-[var(--muted)]">На этот день заявок нет.</li>
        )}
        {bookings.map((booking) => (
          <li
            key={booking.id}
            className="rounded-2xl border border-[var(--line)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-display text-xl">
                {minutesToTime(booking.startMin)} · {booking.clientName}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {STATUS[booking.status]} ·{" "}
                {booking.source === "telegram" ? "Telegram" : "сайт"}
              </p>
            </div>
            <p className="mt-1 text-[var(--muted)]">
              {booking.barber.name} · {booking.service.name} · {booking.phone}
            </p>
            <div className="mt-3 flex gap-3 text-sm">
              {booking.status !== "confirmed" && (
                <button
                  type="button"
                  className="text-[var(--brand)]"
                  onClick={() => onStatus(booking.id, "confirmed")}
                >
                  подтвердить
                </button>
              )}
              {booking.status !== "cancelled" && (
                <button
                  type="button"
                  className="text-[var(--danger)]"
                  onClick={() => onStatus(booking.id, "cancelled")}
                >
                  отменить
                </button>
              )}
              {booking.status === "cancelled" && (
                <button
                  type="button"
                  className="text-[var(--brand)]"
                  onClick={() => onStatus(booking.id, "new")}
                >
                  вернуть
                </button>
              )}
              {booking.status !== "cancelled" &&
                wantsTelegramReminder(booking) &&
                booking.telegramChatId && (
                <button
                  type="button"
                  className="text-[var(--brand)]"
                  disabled={remindingId === booking.id}
                  onClick={() => onRemind(booking.id)}
                >
                  {remindingId === booking.id
                    ? "отправляем…"
                    : "напомнить в Telegram"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
