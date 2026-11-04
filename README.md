# Craft Barbershop

Сайт записи и Telegram-бот для барбершопа. Заявки с лендинга и из бота пишутся в одну SQLite-базу и дублируются в Telegram-группу.

## Стек

Next.js, React, Tailwind CSS, Prisma, SQLite, grammY.

## Запуск

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Сайт: http://localhost:3000  
Админка: http://localhost:3000/admin  
Пароль из `.env`: `craft-admin`

Бот — отдельный процесс:

```bash
npm run bot
```

## Telegram

1. Создайте бота у [@BotFather](https://t.me/BotFather) и скопируйте токен в `BOT_TOKEN`.
2. Создайте группу, добавьте бота, напишите в группе любое сообщение.
3. Узнайте `GROUP_CHAT_ID` (через [@userinfobot](https://t.me/userinfobot) или `getUpdates`) и пропишите его в `.env`.
4. Перезапустите `npm run bot` и сайт.

Если токен или id группы пустые, запись всё равно сохраняется. В админке будет пометка, что Telegram не подключён.

## Mini App

Календарь записи живёт на `/tg`. Локально его можно проверить так:

```bash
npm run miniapp
```

Команда поднимет сайт, если он ещё не запущен, и откроет http://localhost:3000/tg — тот же экран, что в Telegram. Запись из него попадает в журнал как заявка Mini App.

Пока нет публичного https, после `/start` бот присылает ссылку «Проверить Mini App локально».

Чтобы кнопка Mini App открывалась внутри Telegram, нужен публичный **https**-адрес (после публикации сайта или через туннель вроде ngrok / Cloudflare Tunnel):

1. У [@BotFather](https://t.me/BotFather) выполните `/setdomain` и укажите хост без пути, например `your-domain.com`.
2. В `.env` пропишите `TELEGRAM_WEBAPP_URL=https://your-domain.com`.
3. Перезапустите `npm run bot`.

В боте появится кнопка меню «Запись» и кнопка «Открыть календарь» после `/start`. Запись из Mini App попадает в тот же журнал.

## Мокап

В базе сразу есть четыре барбера, пять услуг и заявки на ближайшие рабочие дни.
