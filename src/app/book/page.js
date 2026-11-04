import SiteChrome from "@/components/SiteChrome";
import { catalog } from "@/lib/slots";
import BookForm from "./BookForm";

export default async function BookPage() {
  const { services, barbers } = await catalog();
  return (
    <SiteChrome
      current="book"
      title="Онлайн-запись"
      lead="Выберите услугу, мастера и окно в графике. Заявка сразу уйдёт в журнал и, если Telegram подключён, в группу смены."
    >
      <BookForm services={services} barbers={barbers} />
    </SiteChrome>
  );
}
