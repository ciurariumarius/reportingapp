"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Autentificarea a esuat.");
      setPending(false);
      return;
    }

    router.push("/admin/clients");
    router.refresh();
  }

  return (
    <form
      className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
      onSubmit={onSubmit}
    >
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-digital">
          DigitalDot
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Admin reports
        </h1>
      </div>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Utilizator
        </span>
        <input
          className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2"
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Parola
        </span>
        <input
          className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="focus-ring w-full rounded-md bg-digital px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-digital-ink"
        disabled={pending}
        type="submit"
      >
        {pending ? "Se verifica..." : "Autentificare"}
      </button>
    </form>
  );
}
