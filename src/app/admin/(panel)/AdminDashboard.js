"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BarbersPanel, { DAY_ORDER } from "@/components/admin/BarbersPanel";
import BookingsPanel from "@/components/admin/BookingsPanel";
import WorkloadPanel from "@/components/admin/WorkloadPanel";
import { defaultHours, mondayOfWeek, todayISO } from "@/lib/time";

function emptyBarber() {
  return {
    name: "",
    specialty: "",
    bio: "",
    hours: defaultHours(),
    active: true,
  };
}

export default function AdminDashboard({ telegramConfigured }) {
  const router = useRouter();
  const [tab, setTab] = useState("bookings");
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [weekStart, setWeekStart] = useState(mondayOfWeek(todayISO()));
  const [gridDay, setGridDay] = useState(todayISO());
  const [draft, setDraft] = useState(emptyBarber());
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [remindingId, setRemindingId] = useState("");

  async function loadBookings(nextDate = date) {
    const response = await fetch(`/api/admin/bookings?date=${nextDate}`);
    const data = await response.json();
    setBookings(data.bookings || []);
  }

  async function loadBarbers() {
    const response = await fetch("/api/admin/barbers");
    const data = await response.json();
    setBarbers(data.barbers || []);
  }

  async function loadWorkload(start = weekStart) {
    const response = await fetch(`/api/admin/workload?weekStart=${start}`);
    const data = await response.json();
    setWorkload(data);
    if (data.grid?.length) {
      const exists = data.grid.some((day) => day.date === gridDay);
      if (!exists) setGridDay(data.grid[0].date);
    }
  }

  useEffect(() => {
    loadBookings();
    loadBarbers();
    loadWorkload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendReminder(id) {
    setRemindingId(id);
    setMessage("");
    const response = await fetch(`/api/admin/bookings/${id}/remind`, {
      method: "POST",
    });
    const data = await response.json();
    setRemindingId("");
    if (!response.ok) {
      setMessage(data.error || "Не удалось отправить напоминание");
      return;
    }
    setMessage("Напоминание отправлено в Telegram");
  }

  async function changeStatus(id, status) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadBookings();
    await loadWorkload();
  }

  async function saveBarber(event) {
    event.preventDefault();
    const payload = {
      name: draft.name,
      specialty: draft.specialty,
      bio: draft.bio,
      hours: draft.hours,
      active: draft.active,
    };
    const url = editingId
      ? `/api/admin/barbers/${editingId}`
      : "/api/admin/barbers";
    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Не удалось сохранить");
      return;
    }
    setMessage(editingId ? "График обновлён" : "Барбер добавлен");
    setDraft(emptyBarber());
    setEditingId("");
    await loadBarbers();
    await loadWorkload();
  }

  function editBarber(barber) {
    setEditingId(barber.id);
    setDraft({
      name: barber.name,
      specialty: barber.specialty,
      bio: barber.bio,
      hours: DAY_ORDER.map(
        (weekday) =>
          barber.hours.find((h) => h.weekday === weekday) || {
            weekday,
            startMin: 600,
            endMin: 1200,
            isOff: true,
          }
      ),
      active: barber.active,
    });
    setTab("barbers");
  }

  async function toggleActive(barber) {
    await fetch(`/api/admin/barbers/${barber.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !barber.active }),
    });
    await loadBarbers();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function shiftWeek(next) {
    setWeekStart(next);
    loadWorkload(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[var(--muted)]">
          {telegramConfigured
            ? "Новые заявки дублируются в Telegram-группу."
            : "Telegram не подключён: заявки сохраняются только в журнале."}
        </p>
        <button type="button" onClick={logout} className="btn btn-outline">
          Выйти
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["bookings", "Заявки"],
          ["load", "Загруженность"],
          ["barbers", "Барберы"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-5 py-2 text-sm ${
              tab === id
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--line)] bg-[var(--panel)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 text-[var(--brand)]">{message}</p>}

      {tab === "bookings" && (
        <BookingsPanel
          date={date}
          bookings={bookings}
          onDate={(next) => {
            setDate(next);
            loadBookings(next);
          }}
          onStatus={changeStatus}
          onRemind={sendReminder}
          remindingId={remindingId}
        />
      )}

      {tab === "load" && (
        <WorkloadPanel
          workload={workload}
          weekStart={weekStart}
          gridDay={gridDay}
          onWeek={shiftWeek}
          onGridDay={setGridDay}
        />
      )}

      {tab === "barbers" && (
        <BarbersPanel
          barbers={barbers}
          draft={draft}
          editingId={editingId}
          onEdit={editBarber}
          onToggle={toggleActive}
          onDraft={setDraft}
          onSave={saveBarber}
          onCancel={() => {
            setEditingId("");
            setDraft(emptyBarber());
          }}
        />
      )}
    </div>
  );
}
