"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteChrome from "@/components/SiteChrome";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("Пароль не подошёл");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <SiteChrome
      current="admin"
      title="Вход в журнал"
      lead="Пароль администратора из файла .env. Демо: craft-admin."
    >
      <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-8">
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
          />
        </label>
        {error && <p className="text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary w-full">
          Войти
        </button>
      </form>
    </SiteChrome>
  );
}
