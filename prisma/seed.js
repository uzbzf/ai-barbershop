const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDays(from, days) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}

function nextDate(isOffByWeekday, startOffset = 0) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = startOffset; i < 21; i += 1) {
    const date = addDays(today, i);
    if (!isOffByWeekday[date.getDay()]) return toISODate(date);
  }
  return toISODate(today);
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.telegramClient.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();

  const services = await Promise.all(
    [
      { name: "Стрижка", durationMin: 45, price: 1500, sortOrder: 1 },
      { name: "Стрижка и борода", durationMin: 75, price: 2200, sortOrder: 2 },
      { name: "Борода", durationMin: 30, price: 900, sortOrder: 3 },
      { name: "Королевское бритьё", durationMin: 45, price: 1800, sortOrder: 4 },
      { name: "Детская стрижка", durationMin: 30, price: 1000, sortOrder: 5 },
    ].map((item) => prisma.service.create({ data: item }))
  );

  const byName = Object.fromEntries(services.map((s) => [s.name, s]));

  const alisherHours = {
    0: { isOff: true },
    1: { start: 10 * 60, end: 20 * 60 },
    2: { start: 10 * 60, end: 20 * 60 },
    3: { start: 10 * 60, end: 20 * 60 },
    4: { start: 10 * 60, end: 20 * 60 },
    5: { start: 10 * 60, end: 20 * 60 },
    6: { start: 11 * 60, end: 18 * 60 },
  };
  const markHours = {
    0: { isOff: true },
    1: { isOff: true },
    2: { start: 11 * 60, end: 19 * 60 },
    3: { start: 11 * 60, end: 19 * 60 },
    4: { start: 11 * 60, end: 19 * 60 },
    5: { start: 11 * 60, end: 19 * 60 },
    6: { start: 10 * 60, end: 16 * 60 },
  };
  const timurHours = {
    0: { start: 12 * 60, end: 18 * 60 },
    1: { isOff: true },
    2: { isOff: true },
    3: { start: 12 * 60, end: 21 * 60 },
    4: { start: 12 * 60, end: 21 * 60 },
    5: { start: 12 * 60, end: 21 * 60 },
    6: { start: 12 * 60, end: 21 * 60 },
  };
  const ivanHours = {
    0: { isOff: true },
    1: { start: 9 * 60, end: 18 * 60 },
    2: { start: 9 * 60, end: 18 * 60 },
    3: { start: 9 * 60, end: 18 * 60 },
    4: { start: 9 * 60, end: 18 * 60 },
    5: { start: 9 * 60, end: 18 * 60 },
    6: { isOff: true },
  };

  const toRows = (hours) =>
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      startMin: hours[weekday].start ?? 10 * 60,
      endMin: hours[weekday].end ?? 20 * 60,
      isOff: Boolean(hours[weekday].isOff),
    }));

  const [alisher, mark, timur, ivan] = await Promise.all([
    prisma.barber.create({
      data: {
        name: "Алишер Рахимов",
        specialty: "фейды и плотность",
        bio: "Десять лет на кресле. Держит линию так, будто она вырезана по линейке.",
        initials: "АР",
        accent: "#8C6A3D",
        hours: { create: toRows(alisherHours) },
      },
    }),
    prisma.barber.create({
      data: {
        name: "Марк Волков",
        specialty: "классика и ножницы",
        bio: "Работает тихо. Классическая стрижка у него выглядит так, будто так и задумано с рождения.",
        initials: "МВ",
        accent: "#1B3A5C",
        hours: { create: toRows(markHours) },
      },
    }),
    prisma.barber.create({
      data: {
        name: "Тимур Саидов",
        specialty: "борода и бритьё",
        bio: "Пар, полотенце, опасная бритва. После него борода лежит ровно.",
        initials: "ТС",
        accent: "#A33B32",
        hours: { create: toRows(timurHours) },
      },
    }),
    prisma.barber.create({
      data: {
        name: "Иван Петров",
        specialty: "детские и семейные",
        bio: "Умеет стричь тех, кто крутится. Родители обычно выдыхают на третьей минуте.",
        initials: "ИП",
        accent: "#3F5D4A",
        hours: { create: toRows(ivanHours) },
      },
    }),
  ]);

  const off = (hours) =>
    [0, 1, 2, 3, 4, 5, 6].reduce((acc, day) => {
      acc[day] = Boolean(hours[day].isOff);
      return acc;
    }, {});

  const bookings = [
    {
      barber: alisher,
      hours: alisherHours,
      service: byName["Стрижка"],
      startMin: 11 * 60,
      source: "site",
      clientName: "Денис Орлов",
      phone: "+7 900 111-22-31",
      offset: 0,
    },
    {
      barber: mark,
      hours: markHours,
      service: byName["Борода"],
      startMin: 14 * 60,
      source: "telegram",
      clientName: "Руслан Каримов",
      phone: "+7 900 222-18-44",
      offset: 0,
    },
    {
      barber: timur,
      hours: timurHours,
      service: byName["Королевское бритьё"],
      startMin: 16 * 60,
      source: "site",
      clientName: "Андрей Белов",
      phone: "+7 900 333-09-17",
      offset: 0,
    },
    {
      barber: ivan,
      hours: ivanHours,
      service: byName["Детская стрижка"],
      startMin: 10 * 60,
      source: "telegram",
      clientName: "Ольга Петрова",
      phone: "+7 900 444-55-01",
      offset: 0,
    },
    {
      barber: alisher,
      hours: alisherHours,
      service: byName["Стрижка и борода"],
      startMin: 15 * 60,
      source: "site",
      clientName: "Кирилл Назаров",
      phone: "+7 900 555-61-20",
      offset: 1,
    },
    {
      barber: mark,
      hours: markHours,
      service: byName["Стрижка"],
      startMin: 12 * 60,
      source: "telegram",
      clientName: "Павел Смирнов",
      phone: "+7 900 666-70-08",
      offset: 2,
    },
    {
      barber: timur,
      hours: timurHours,
      service: byName["Борода"],
      startMin: 13 * 60,
      source: "site",
      clientName: "Игорь Левин",
      phone: "+7 900 777-12-90",
      offset: 1,
    },
    {
      barber: ivan,
      hours: ivanHours,
      service: byName["Стрижка"],
      startMin: 15 * 60 + 30,
      source: "site",
      clientName: "Никита Жуков",
      phone: "+7 900 888-33-14",
      offset: 1,
      status: "confirmed",
    },
  ];

  const used = {};
  for (const item of bookings) {
    const key = item.barber.id;
    const start = used[key] ?? item.offset;
    const date = nextDate(off(item.hours), start);
    used[key] = start + 1;
    await prisma.booking.create({
      data: {
        clientName: item.clientName,
        phone: item.phone,
        serviceId: item.service.id,
        barberId: item.barber.id,
        date,
        startMin: item.startMin,
        source: item.source,
        status: item.status || "new",
      },
    });
  }

  console.log("Craft Barbershop seed ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
