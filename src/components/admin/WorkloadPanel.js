"use client";

import Avatar from "@/components/Avatar";
import { addDaysISO, formatLongDate } from "@/lib/time";

export default function WorkloadPanel({
  workload,
  weekStart,
  gridDay,
  onWeek,
  onGridDay,
}) {
  if (!workload) return null;
  const dayGrid = workload.grid.find((day) => day.date === gridDay);

  return (
    <section className="card mt-8 p-6">
      <h2 className="font-display text-2xl">
        Сегодня, {formatLongDate(workload.today)}
      </h2>
      <ul className="mt-6 divide-y divide-[var(--line)]">
        {workload.todayStats.map((row) => (
          <li key={row.id} className="flex items-center gap-4 py-3">
            <Avatar initials={row.initials} accent={row.accent} size={40} />
            <div className="flex-1">
              <p>{row.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {row.isOff
                  ? "выходной"
                  : `${row.pct}% · ${row.bookedMin} из ${row.workMin} мин`}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-2xl">Неделя</h2>
        <button type="button" onClick={() => onWeek(addDaysISO(weekStart, -7))}>
          назад
        </button>
        <button type="button" onClick={() => onWeek(addDaysISO(weekStart, 7))}>
          дальше
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {workload.grid.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onGridDay(day.date)}
            className={`rounded-full border px-3 py-1 text-sm ${
              gridDay === day.date
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)]"
            }`}
          >
            {formatLongDate(day.date)}
          </button>
        ))}
      </div>
      {dayGrid && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="py-2 text-left font-normal text-[var(--muted)]">
                  барбер
                </th>
                {workload.hours.map((h) => (
                  <th key={h} className="px-1 font-normal text-[var(--muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayGrid.rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-3">{row.name.split(" ")[0]}</td>
                  {row.cells.map((cell) => (
                    <td key={cell.hour} className="px-1">
                      <span
                        className={`block h-6 ${
                          !cell.working
                            ? "bg-transparent"
                            : cell.busy
                              ? "rounded bg-[var(--brand)]"
                              : "rounded bg-[var(--brand-soft)]"
                        }`}
                        title={
                          cell.busy
                            ? "занято"
                            : cell.working
                              ? "свободно"
                              : "вне смены"
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
