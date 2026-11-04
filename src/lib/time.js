export const WEEKDAYS = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

export const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

export const MONTHS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export const MONTHS_GEN = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function timeToMinutes(value) {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDaysISO(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function weekdayOf(iso) {
  return parseISODate(iso).getDay();
}

export function formatLongDate(iso) {
  const date = parseISODate(iso);
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  return `${day} ${MONTHS_GEN[date.getMonth()]}`;
}

export function formatDateTime(iso, startMin) {
  return `${formatLongDate(iso)}, ${minutesToTime(startMin)}`;
}

export function bookingStartMs(iso, startMin) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(
    y,
    m - 1,
    d,
    Math.floor(startMin / 60),
    startMin % 60,
    0,
    0
  ).getTime();
}

export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function mondayOfWeek(iso) {
  const date = parseISODate(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

export function overlaps(aStart, aDur, bStart, bDur) {
  return aStart < bStart + bDur && bStart < aStart + aDur;
}

export function defaultHours() {
  return [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
    weekday,
    startMin: 10 * 60,
    endMin: 20 * 60,
    isOff: weekday === 0,
  }));
}
