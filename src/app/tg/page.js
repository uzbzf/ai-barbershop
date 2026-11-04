import { catalog } from "@/lib/slots";
import TelegramMiniApp from "./TelegramMiniApp";

export default async function TelegramPage() {
  const { services, barbers } = await catalog();
  return <TelegramMiniApp services={services} barbers={barbers} />;
}
