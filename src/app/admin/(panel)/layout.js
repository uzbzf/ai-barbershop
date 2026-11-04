import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export default async function AdminPanelLayout({ children }) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
  return children;
}
