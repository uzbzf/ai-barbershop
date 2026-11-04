"use client";

import { useEffect, useMemo, useState } from "react";
import { SHOP } from "@/lib/shop";
import {
  MONTHS,
  WEEKDAYS,
  formatLongDate,
  minutesToTime,
  monthGrid,
  todayISO,
  weekdayOf,
} from "@/lib/time";

export default function BookForm({ services, barbers }) {
  const now = new Date();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [barberId, setBarberId] = useState(barbers[0]?.id || "");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startMin, setStartMin] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const barber = barbers.find((item) => item.id === barberId);
  const service = services.find((item) => item.id === serviceId);
  const today = todayISO();
  const cells = useMemo(() => monthGrid(year, month), [year, month]);

  const offDays = useMemo(() => {
    const set = new Set();
    barber?.hours.forEach((hour) => {
      if (hour.isOff) set.add(hour.weekday);
    });
    return set;
  }, [barber]);

  useEffect(() => {
    setStartMin(null);
    setSlots([]);
    if (!serviceId || !barberId || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`/api/slots?barberId=${barberId}&serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots || []);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, barberId, date]);

  function shiftMonth(delta) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function dayDisabled(iso) {
    if (!iso) return true;
    if (iso < today) return true;
    return offDays.has(weekdayOf(iso));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("saving");
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        barberId,
        date,
        startMin,
        clientName: name,
        phone,
        telegramUsername: telegram,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus("idle");
      setError(data.error || "Не удалось записаться");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="card max-w-xl p-8">
        <p className="eyebrow">Done</p>
        <h2 className="mt-2 font-display text-3xl">Вы в журнале</h2>
        <p className="mt-4 leading-relaxed text-[var(--muted)]">
          {name}, {service?.name.toLowerCase()} у {barber?.name} —{" "}
          {formatLongDate(date)} в {minutesToTime(startMin)}.
        </p>
        {telegram.trim() && (
          <p className="mt-4 leading-relaxed text-[var(--muted)]">
            Напоминание придёт в Telegram, если один раз напишите боту{" "}
            <a
              className="text-[var(--brand)]"
              href={`https://t.me/${SHOP.botUsername}`}
            >
              @{SHOP.botUsername}
            </a>{" "}
            команду /start.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
      <fieldset className="card p-6">
        <legend className="font-display text-2xl">Услуга</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {services.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-baseline justify-between gap-4 rounded-2xl border px-4 py-3 ${
                serviceId === item.id
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--line)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="service"
                  checked={serviceId === item.id}
                  onChange={() => setServiceId(item.id)}
                />
                {item.name}
              </span>
              <span className="text-[var(--muted)]">
                {item.durationMin} мин · {item.price.toLocaleString("ru-RU")} ₽
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="card p-6">
        <legend className="font-display text-2xl">Барбер</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {barbers.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 ${
                barberId === item.id
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--line)]"
              }`}
            >
              <input
                type="radio"
                name="barber"
                checked={barberId === item.id}
                onChange={() => {
                  setBarberId(item.id);
                  setDate("");
                }}
              />
              <span>
                <span className="block font-display text-lg">{item.name}</span>
                <span className="text-[var(--muted)]">{item.specialty}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="card p-6">
        <legend className="font-display text-2xl">День</legend>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} className="text-sm">
            назад
          </button>
          <p className="font-display">
            {MONTHS[month]} {year}
          </p>
          <button type="button" onClick={() => shiftMonth(1)} className="text-sm">
            дальше
          </button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-sm">
          {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((d) => (
            <div key={d} className="py-1 text-[var(--muted)]">
              {d}
            </div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e-${i}`} />;
            const disabled = dayDisabled(iso);
            const selected = date === iso;
            const isToday = iso === today;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => setDate(iso)}
                className={`h-10 rounded-xl ${
                  selected
                    ? "bg-[var(--brand)] text-white"
                    : disabled
                      ? "text-[var(--line)]"
                      : isToday
                        ? "text-[var(--today)]"
                        : "hover:bg-[var(--brand-soft)]"
                }`}
              >
                {Number(iso.slice(-2))}
              </button>
            );
          })}
        </div>
        {barber && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Выходные:{" "}
            {barber.hours
              .filter((h) => h.isOff)
              .map((h) => WEEKDAYS[h.weekday])
              .join(", ") || "нет"}
          </p>
        )}
      </fieldset>

      <fieldset className="card p-6">
        <legend className="font-display text-2xl">Время</legend>
        {!date ? (
          <p className="mt-3 text-[var(--muted)]">Сначала выберите день.</p>
        ) : loadingSlots ? (
          <p className="mt-3 text-[var(--muted)]">Смотрим свободные окна…</p>
        ) : slots.length === 0 ? (
          <p className="mt-3 text-[var(--muted)]">
            На {formatLongDate(date)} свободных окон нет.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setStartMin(slot)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  startMin === slot
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--line)] bg-[var(--panel)]"
                }`}
              >
                {minutesToTime(slot)}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
        <legend className="font-display text-2xl sm:col-span-2">Контакты</legend>
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Имя</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Телефон</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7"
            className="input mt-1"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--muted)]">
            Telegram для напоминаний
          </span>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="input mt-1"
          />
          <span className="mt-2 block text-sm text-[var(--muted)]">
            Необязательно. Если оставить пустым, напоминание не отправим. Если
            укажете аккаунт — напишите боту{" "}
            <a
              className="text-[var(--brand)]"
              href={`https://t.me/${SHOP.botUsername}`}
            >
              @{SHOP.botUsername}
            </a>{" "}
            /start, иначе сообщение не дойдёт.
          </span>
        </label>
      </fieldset>

      {error && <p className="text-[var(--danger)]">{error}</p>}

      <button
        type="submit"
        disabled={!date || startMin == null || status === "saving"}
        className="btn btn-primary disabled:opacity-40"
      >
        {status === "saving" ? "Пишем в журнал…" : "Подтвердить запись"}
      </button>
    </form>
  );
}
