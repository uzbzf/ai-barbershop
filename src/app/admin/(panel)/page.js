import SiteChrome from "@/components/SiteChrome";
import { telegramConfigured } from "@/lib/telegram";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage() {
  return (
    <SiteChrome
      current="admin"
      title="Журнал смены"
      lead="Заявки, загруженность кресел и график барберов в одном экране."
    >
      <AdminDashboard telegramConfigured={telegramConfigured()} />
    </SiteChrome>
  );
}
