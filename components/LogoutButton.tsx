"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function csrfHeaders(): Record<string, string> {
  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("dd_csrf_token="))
    ?.slice("dd_csrf_token=".length);

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/admin/login", { method: "DELETE", headers: csrfHeaders() });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-digital hover:text-digital"
      disabled={pending}
      onClick={logout}
      type="button"
    >
      Iesire
    </button>
  );
}
