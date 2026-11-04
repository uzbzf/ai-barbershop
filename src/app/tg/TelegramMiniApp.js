"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MONTHS,
  formatLongDate,
  minutesToTime,
  monthGrid,
  todayISO,
  weekdayOf,
} from "@/lib/time";
import { applyLocalTelegram } from "./localTelegram";

function telegram() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
}

function userName(tg) {
  const user = tg?.initDataUnsafe?.user;
  if (!user) return "";
  return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

export default function TelegramMiniApp({ services, barbers }) {
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
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [scheme, setScheme] = useState("dark");
  const [insideTelegram, setInsideTelegram] = useState(false);
  const [localPreview, setLocalPreview] = useState(false);
  const [booted, setBooted] = useState(false);

  const barber = barbers.find((item) => item.id === barberId);
  const service = services.find((item) => item.id === serviceId);
  const today = todayISO();
  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const ready = Boolean(
    date &&
      startMin != null &&
      name.trim().length >= 2 &&
      phone.replace(/\D/g, "").length >= 9
  );

  const offDays = useMemo(() => {
    const set = new Set();
    barber?.hours.forEach((hour) => {
      if (hour.isOff) set.add(hour.weekday);
    });
    return set;
  }, [barber]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mock = await applyLocalTelegram();
      if (cancelled) return;
      const tg = telegram();
      setLocalPreview(Boolean(mock.mocked));
      setInsideTelegram(Boolean(tg?.initData));
      if (!tg) {
        setBooted(true);
        return;
      }
      tg.ready();
      tg.expand();
      setScheme(tg.colorScheme === "light" ? "light" : "dark");
      document.documentElement.classList.toggle(
        "dark",
        tg.colorScheme !== "light"
      );
      document.documentElement.classList.toggle(
        "light",
        tg.colorScheme === "light"
      );
      if (!name) setName(userName(tg));
      const onTheme = () =>
        setScheme(tg.colorScheme === "light" ? "light" : "dark");
      tg.onEvent?.("themeChanged", onTheme);
      setBooted(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStartMin(null);
    setSlots([]);
    if (!serviceId || !barberId || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`/api/slots?barberId=${barberId}&serviceId=${serviceId}&date=${date}`)
      .then((response) => response.json())
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

  useEffect(() => {
    const tg = telegram();
    if (!tg?.MainButton) return;
    if (status === "done") {
      tg.MainButton.setText("Закрыть");
      tg.MainButton.show();
      tg.MainButton.onClick(tg.close);
      return () => tg.MainButton.offClick(tg.close);
    }
    if (!ready || status === "saving") {
      tg.MainButton.hide();
      return;
    }
    tg.MainButton.setText("Записаться");
    tg.MainButton.show();
    tg.MainButton.onClick(submit);
    return () => tg.MainButton.offClick(submit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, status, serviceId, barberId, date, startMin, name, phone]);

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

  function haptic() {
    telegram()?.HapticFeedback?.selectionChanged?.();
  }

  async function submit() {
    if (!ready || status === "saving") return;
    setError("");
    setStatus("saving");
    const tg = telegram();
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": tg?.initData || "",
      },
      body: JSON.stringify({
        serviceId,
        barberId,
        date,
        startMin,
        clientName: name,
        phone,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus("idle");
      setError(data.error || "Не удалось записаться");
      tg?.HapticFeedback?.notificationOccurred?.("error");
      return;
    }
    setStatus("done");
    tg?.HapticFeedback?.notificationOccurred?.("success");
  }

  if (!booted) {
    return (
      <div className="tg-shell" data-scheme={scheme}>
        <div className="tg-app">
          <p style={{ color: "var(--tg-hint)" }}>Открываю Mini App…</p>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="tg-shell" data-scheme={scheme}>
      <div className="tg-app">
        <p className="text-sm" style={{ color: "var(--tg-hint)" }}>
          Craft Barbershop
        </p>
        <h1 className="mt-3 text-3xl leading-tight">Вы в журнале</h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--tg-hint)" }}>
          {name}, {service?.name.toLowerCase()} у {barber?.name} —{" "}
          {formatLongDate(date)} в {minutesToTime(startMin)}.
        </p>
        {localPreview && (
          <p className="mt-8 text-sm" style={{ color: "var(--tg-hint)" }}>
            Локальная проверка. В Telegram после публикации откроется тот же экран.
          </p>
        )}
      </div>
      </div>
    );
  }

  return (
    <div className="tg-shell" data-scheme={scheme}>
    <form
      className="tg-app space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <header>
        <p className="text-sm" style={{ color: "var(--tg-hint)" }}>
          {localPreview
            ? "Локальная проверка Mini App"
            : insideTelegram
              ? "Mini App"
              : "Просмотр Mini App"}
        </p>
        <h1 className="mt-1 text-3xl leading-none">Запись</h1>
      </header>

      <section>
        <h2 className="mb-3 text-lg">Услуга</h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tg-chip ${serviceId === item.id ? "is-on" : ""}`}
              onClick={() => {
                setServiceId(item.id);
                haptic();
              }}
            >
              {item.name} · {item.price.toLocaleString("ru-RU")}₽
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg">Мастер</h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {barbers.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tg-chip ${barberId === item.id ? "is-on" : ""}`}
              onClick={() => {
                setBarberId(item.id);
                setDate("");
                haptic();
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)}>
            ‹
          </button>
          <h2 className="tg-display text-lg">
            {MONTHS[month]} {year}
          </h2>
          <button type="button" onClick={() => shiftMonth(1)}>
            ›
          </button>
        </div>
        <div className="tg-cal text-xs" style={{ color: "var(--tg-hint)" }}>
          {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
          {cells.map((iso, index) => {
            if (!iso) return <div key={`e-${index}`} />;
            const disabled = dayDisabled(iso);
            const selected = date === iso;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setDate(iso);
                  haptic();
                }}
                className={`tg-day ${selected ? "is-on" : ""} ${
                  disabled ? "is-off" : ""
                } ${iso === today ? "is-today" : ""}`}
              >
                {Number(iso.slice(-2))}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg">Время</h2>
        {!date ? (
          <p style={{ color: "var(--tg-hint)" }}>Сначала день в календаре.</p>
        ) : loadingSlots ? (
          <p style={{ color: "var(--tg-hint)" }}>Смотрим окна…</p>
        ) : slots.length === 0 ? (
          <p style={{ color: "var(--tg-hint)" }}>
            На {formatLongDate(date)} свободных окон нет.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`tg-chip ${startMin === slot ? "is-on" : ""}`}
                onClick={() => {
                  setStartMin(slot);
                  haptic();
                }}
              >
                {minutesToTime(slot)}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <label>
          <span className="mb-1 block text-sm" style={{ color: "var(--tg-hint)" }}>
            Имя
          </span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="tg-input"
          />
        </label>
        <label>
          <span className="mb-1 block text-sm" style={{ color: "var(--tg-hint)" }}>
            Телефон
          </span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+998"
            className="tg-input"
          />
        </label>
      </section>

      {error && <p className="text-[var(--danger)]">{error}</p>}

      {!insideTelegram && !localPreview && (
        <button
          type="submit"
          disabled={!ready || status === "saving"}
          className="tg-submit"
        >
          {status === "saving" ? "Пишем в журнал…" : "Записаться"}
        </button>
      )}
    </form>
    </div>
  );
}
