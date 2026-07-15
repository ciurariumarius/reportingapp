"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ReportPinGateProps = {
  clientName: string;
  slug: string;
};

export function ReportPinGate({ clientName, slug }: ReportPinGateProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch(`/api/client/${slug}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    setPending(false);

    if (!response.ok) {
      setError(data.error || "PIN incorect.");
      return;
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-digital-mist text-digital">
            <LockKeyhole aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-950">Acces raport</h1>
            <p className="text-sm text-slate-500">{clientName}</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              PIN raport
            </span>
            <input
              autoComplete="one-time-code"
              autoFocus
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-3 text-center text-2xl font-semibold tracking-[0.35em] text-slate-950"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              pattern="\d{4}"
              placeholder="0000"
              type="password"
              value={pin}
            />
          </label>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            className="focus-ring w-full rounded-md bg-digital px-4 py-2.5 text-sm font-semibold text-white hover:bg-digital-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || pin.length !== 4}
            type="submit"
          >
            {pending ? "Se verifica..." : "Deschide raportul"}
          </button>
        </form>
      </section>
    </main>
  );
}
