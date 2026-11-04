import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import NetworkBg from "./NetworkBg";
import { SHOP } from "@/lib/shop";

const LINKS = [
  { href: "/", id: "home", label: "Главная" },
  { href: "/book", id: "book", label: "Запись" },
  { href: "/admin", id: "admin", label: "Админка" },
];

export default function SiteChrome({
  children,
  current = "home",
  hero = false,
  title,
  lead,
}) {
  const headerLight = Boolean(hero || title);

  return (
    <div className="min-h-screen">
      <header
        className={`sticky top-0 z-30 ${
          headerLight
            ? "bg-[var(--hero)]/90 text-white backdrop-blur"
            : "border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Logo light={headerLight} />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={
                  current === link.id
                    ? headerLight
                      ? "font-semibold text-white"
                      : "font-semibold text-[var(--brand)]"
                    : headerLight
                      ? "text-white/75 hover:text-white"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle light={headerLight} />
            <Link href="/book" className="btn btn-primary hidden sm:inline-flex">
              Записаться
            </Link>
          </div>
        </div>
        <nav
          className={`flex gap-4 overflow-x-auto px-5 pb-3 text-sm md:hidden ${
            headerLight ? "text-white/80" : "text-[var(--muted)]"
          }`}
        >
          {LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={current === link.id ? "font-semibold text-inherit" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {hero ? (
        children
      ) : (
        <>
          {title ? (
            <section className="relative overflow-hidden bg-[var(--hero)] pb-16 pt-12 text-white">
              <NetworkBg />
              <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-200">
                  {SHOP.name}
                </p>
                <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
                  {title}
                </h1>
                {lead ? (
                  <p className="mt-4 max-w-2xl text-white/80">{lead}</p>
                ) : null}
              </div>
            </section>
          ) : null}
          <main className="section-pad pt-10">{children}</main>
        </>
      )}

      <footer className="mt-4 bg-[#07101f] text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Четыре кресла на Мастеров. Запись на сайте и в Telegram сразу
              попадает в журнал смены.
            </p>
          </div>
          <div>
            <p className="font-display text-white">Навигация</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              {LINKS.map((link) => (
                <Link key={link.id} href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-display text-white">Контакты</p>
            <p className="mt-4 text-sm">
              {SHOP.city}, {SHOP.street}
            </p>
            <p className="mt-2 text-sm">{SHOP.phone}</p>
            <p className="mt-2 text-sm">{SHOP.hours}</p>
          </div>
          <div>
            <p className="font-display text-white">Telegram</p>
            <p className="mt-4 text-sm text-slate-400">
              Бот записывает клиента в ту же базу, что и сайт. Заявки
              дублируются в группу.
            </p>
            <Link href="/book" className="btn btn-primary mt-5">
              Онлайн-запись
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {SHOP.name}
        </div>
      </footer>
    </div>
  );
}
