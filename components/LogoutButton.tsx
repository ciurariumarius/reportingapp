"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/admin/login", { method: "DELETE" });
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
