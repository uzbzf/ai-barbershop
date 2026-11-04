"use client";

import { WEEKDAYS, minutesToTime, timeToMinutes } from "@/lib/time";

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function HoursEditor({ hours, onChange }) {
  function update(weekday, patch) {
    onChange(
      hours.map((hour) =>
        hour.weekday === weekday ? { ...hour, ...patch } : hour
      )
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {DAY_ORDER.map((weekday) => {
        const hour = hours.find((h) => h.weekday === weekday) || {
          weekday,
          startMin: 600,
          endMin: 1200,
          isOff: true,
        };
        return (
          <div
            key={weekday}
            className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-2 text-sm"
          >
            <span>{WEEKDAYS[weekday]}</span>
            <input
              type="time"
              disabled={hour.isOff}
              value={minutesToTime(hour.startMin)}
              onChange={(e) =>
                update(weekday, { startMin: timeToMinutes(e.target.value) })
              }
              className="input"
            />
            <input
              type="time"
              disabled={hour.isOff}
              value={minutesToTime(hour.endMin)}
              onChange={(e) =>
                update(weekday, { endMin: timeToMinutes(e.target.value) })
              }
              className="input"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hour.isOff}
                onChange={(e) => update(weekday, { isOff: e.target.checked })}
              />
              выходной
            </label>
          </div>
        );
      })}
    </div>
  );
}

export default function BarbersPanel({
  barbers,
  draft,
  editingId,
  onEdit,
  onToggle,
  onDraft,
  onSave,
  onCancel,
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl">В зале</h2>
        <ul className="card mt-4 divide-y divide-[var(--line)] p-4">
          {barbers.map((barber) => (
            <li key={barber.id} className="py-4">
              <p className="font-display text-xl">
                {barber.name}
                {!barber.active && (
                  <span className="ml-2 text-sm text-[var(--muted)]">
                    скрыт
                  </span>
                )}
              </p>
              <p className="text-[var(--muted)]">{barber.specialty}</p>
              <div className="mt-2 flex gap-3 text-sm">
                <button type="button" onClick={() => onEdit(barber)}>
                  график
                </button>
                <button type="button" onClick={() => onToggle(barber)}>
                  {barber.active ? "выключить" : "включить"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={onSave} className="card p-6">
        <h2 className="font-display text-2xl">
          {editingId ? "График барбера" : "Новый барбер"}
        </h2>
        <div className="mt-4 space-y-3">
          <input
            required
            placeholder="Имя"
            value={draft.name}
            onChange={(e) => onDraft({ ...draft, name: e.target.value })}
            className="input"
          />
          <input
            placeholder="Специализация"
            value={draft.specialty}
            onChange={(e) => onDraft({ ...draft, specialty: e.target.value })}
            className="input"
          />
          <textarea
            placeholder="Коротко о мастере"
            value={draft.bio}
            onChange={(e) => onDraft({ ...draft, bio: e.target.value })}
            className="input h-24"
          />
          <HoursEditor
            hours={draft.hours}
            onChange={(hours) => onDraft({ ...draft, hours })}
          />
          <button type="submit" className="btn btn-primary">
            {editingId ? "Сохранить график" : "Добавить барбера"}
          </button>
          {editingId && (
            <button type="button" className="ml-3 text-sm" onClick={onCancel}>
              отмена
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
