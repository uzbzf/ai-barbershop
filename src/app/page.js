import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";
import Avatar from "@/components/Avatar";
import NetworkBg from "@/components/NetworkBg";
import HomeHero from "@/components/HomeHero";
import { catalog, getFreeSlots } from "@/lib/slots";
import { SHOP } from "@/lib/shop";
import { minutesToTime, todayISO, weekdayOf, WEEKDAYS } from "@/lib/time";

function price(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

const PROCESS = [
  {
    n: "01",
    title: "Выбираете услугу",
    text: "Стрижка, борода, бритьё или детское кресло — длительность сразу видна в календаре.",
  },
  {
    n: "02",
    title: "Берёте слот мастера",
    text: "День и время строятся из графика барбера. Занятые окна закрыты.",
  },
  {
    n: "03",
    title: "Заявка в журнале",
    text: "Сайт и Telegram пишут в одну базу. Смена видит запись сразу.",
  },
  {
    n: "04",
    title: "Приходите в зал",
    text: "Мастеров, 17. Без очереди: кресло уже за вами.",
  },
];

export default async function HomePage() {
  const { services, barbers } = await catalog();
  const today = todayISO();
  const weekday = weekdayOf(today);
  const haircut = services.find((s) => s.name === "Стрижка") || services[0];

  const freeToday = [];
  for (const barber of barbers) {
    const hour = barber.hours.find((item) => item.weekday === weekday);
    if (!hour || hour.isOff) continue;
    const slots = haircut
      ? await getFreeSlots(barber.id, haircut.id, today)
      : [];
    freeToday.push({ barber, hour, slotsLeft: slots.length });
  }

  return (
    <SiteChrome current="home" hero>
      <HomeHero street={SHOP.street} phone={SHOP.phone} />

      <section id="services" className="section-pad">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Services</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Наши услуги</h2>
          </div>
          <Link href="/book" className="btn btn-primary">
            Забронировать
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="card p-6">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <span className="font-display">{service.durationMin}</span>
              </div>
              <h3 className="font-display text-xl">{service.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {service.durationMin} минут в кресле. Цена фиксированная.
              </p>
              <p className="mt-5 font-display text-2xl text-[var(--brand)]">
                {price(service.price)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--panel)]">
        <div className="section-pad grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">About</p>
            <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
              Мы держим качество, которое поднимает весь зал.
            </h2>
            <p className="mt-5 leading-relaxed text-[var(--muted)]">
              Четыре кресла, один зал. Стрижём коротко, бреем ровно, не торопим
              разговор. Онлайн-запись и Telegram-бот работают с одним журналом.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["4", "кресла в смене"],
              ["10+", "лет за спинкой"],
              [String(barbers.length), "барбера"],
              ["1", "журнал заявок"],
            ].map(([n, label]) => (
              <div key={label} className="rounded-2xl bg-[var(--brand)] p-6 text-white">
                <p className="font-display text-4xl">{n}</p>
                <p className="mt-2 text-sm text-sky-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <p className="eyebrow">Today</p>
        <h2 className="mt-2 font-display text-3xl">Сегодня в зале</h2>
        {freeToday.length === 0 ? (
          <p className="mt-6 text-[var(--muted)]">
            Сегодня выходной у всех мастеров. Откройте календарь на следующие дни.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {freeToday.map(({ barber, hour, slotsLeft }) => (
              <article key={barber.id} className="card flex items-center gap-4 p-5">
                <Avatar initials={barber.initials} accent={barber.accent} />
                <div>
                  <p className="font-display text-lg">{barber.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {minutesToTime(hour.startMin)}–{minutesToTime(hour.endMin)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--brand)]">
                    {slotsLeft === 0
                      ? "окон на стрижку нет"
                      : `${slotsLeft} свободных окон`}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[var(--panel)]">
        <div className="section-pad">
          <p className="eyebrow">Process</p>
          <h2 className="mt-2 font-display text-3xl">Как проходит запись</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step) => (
              <article key={step.n}>
                <p className="font-display text-4xl text-[var(--brand)]">{step.n}</p>
                <h3 className="mt-3 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <p className="eyebrow">Team</p>
        <h2 className="mt-2 font-display text-3xl">Мастера</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {barbers.map((barber) => {
            const work = barber.hours
              .filter((h) => !h.isOff)
              .map((h) => WEEKDAYS[h.weekday])
              .join(", ");
            return (
              <article key={barber.id} className="card flex gap-5 p-6">
                <Avatar
                  initials={barber.initials}
                  accent={barber.accent}
                  size={84}
                />
                <div>
                  <h3 className="font-display text-2xl">{barber.name}</h3>
                  <p className="text-[var(--brand)]">{barber.specialty}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {barber.bio}
                  </p>
                  <p className="mt-3 text-xs text-[var(--muted)]">{work}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--hero)] text-white">
        <NetworkBg />
        <div className="section-pad relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-200">
              Contact
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Начнём с разговора в кресле
            </h2>
            <p className="mt-4 max-w-md text-white/75">
              {SHOP.city}, {SHOP.street}. Телефон, Telegram или форма на сайте —
              слот сразу в журнале.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Телефон", SHOP.phone],
              ["Адрес", `${SHOP.city}, ${SHOP.street}`],
              ["Часы", SHOP.hours],
              ["Запись", "сайт и Telegram"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-wider text-sky-200">
                  {label}
                </p>
                <p className="mt-2 font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
