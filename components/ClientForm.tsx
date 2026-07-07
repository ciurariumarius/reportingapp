"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { GoogleAdsScriptModal } from "./GoogleAdsScriptModal";

export type ClientFormValue = {
  name: string;
  slug: string;
  active: boolean;
  timezone: string;
  currency: string;
  locale: "ro" | "en";
  ga4PropertyId: string;
  metaAdAccountId: string;
  googleAdsSheetUrl: string;
  notes: string;
  insightMonth: string;
  whatWentWell: string;
  whatNeedsAttention: string;
  recommendedNextActions: string;
};

type ClientFormProps = {
  mode: "create" | "edit";
  initialValue?: Partial<ClientFormValue> & { hasShareToken?: boolean };
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function defaultValue(): ClientFormValue {
  return {
    name: "",
    slug: "",
    active: true,
    timezone: "Europe/Bucharest",
    currency: "RON",
    locale: "ro",
    ga4PropertyId: "",
    metaAdAccountId: "",
    googleAdsSheetUrl: "",
    notes: "",
    insightMonth: currentMonth(),
    whatWentWell: "",
    whatNeedsAttention: "",
    recommendedNextActions: ""
  };
}

export function ClientForm({ mode, initialValue }: ClientFormProps) {
  const router = useRouter();
  const [value, setValue] = useState<ClientFormValue>({
    ...defaultValue(),
    ...initialValue
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const endpoint = useMemo(
    () =>
      mode === "create"
        ? "/api/admin/clients"
        : `/api/admin/clients/${initialValue?.slug}`,
    [initialValue?.slug, mode]
  );

  function update<K extends keyof ClientFormValue>(key: K, next: ClientFormValue[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    const data = (await response.json()) as {
      error?: string;
      issues?: string[];
      client?: { slug: string };
    };

    setPending(false);

    if (!response.ok) {
      setError(data.issues?.join(" ") || data.error || "Nu am putut salva clientul.");
      return;
    }

    setNotice("Clientul a fost salvat.");
    router.push(`/admin/clients/${data.client?.slug ?? value.slug}`);
    router.refresh();
  }

  async function generateShareLink() {
    setError("");
    setNotice("");
    setShareUrl("");
    const response = await fetch(`/api/admin/clients/${initialValue?.slug}/share-link`, {
      method: "POST"
    });
    const data = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !data.url) {
      setError(data.error ?? "Nu am putut genera linkul.");
      return;
    }

    setShareUrl(data.url);
    setNotice("Linkul secret a fost generat. Linkul complet este afisat o singura data.");
  }

  async function deleteClient() {
    if (!window.confirm("Stergi acest client? Actiunea nu poate fi anulata.")) {
      return;
    }

    const response = await fetch(`/api/admin/clients/${initialValue?.slug}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Nu am putut sterge clientul.");
      return;
    }

    router.push("/admin/clients");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Nume client"
            onChange={(next) => update("name", next)}
            required
            value={value.name}
          />
          <TextField
            help="Exemplu: client-demo"
            label="Slug"
            onChange={(next) => update("slug", next)}
            required
            value={value.slug}
          />
          <TextField
            label="Timezone"
            onChange={(next) => update("timezone", next)}
            value={value.timezone}
          />
          <TextField
            label="Moneda"
            onChange={(next) => update("currency", next.toUpperCase())}
            value={value.currency}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Limba
            </span>
            <select
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) => update("locale", event.target.value as "ro" | "en")}
              value={value.locale}
            >
              <option value="ro">Romana</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="flex items-center gap-3 self-end rounded-md border border-slate-200 px-3 py-2">
            <input
              checked={value.active}
              onChange={(event) => update("active", event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm font-medium text-slate-700">Client activ</span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Surse de date</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="GA4 property ID"
            onChange={(next) => update("ga4PropertyId", next)}
            placeholder="properties/123456789"
            value={value.ga4PropertyId}
          />
          <TextField
            label="Meta ad account ID"
            onChange={(next) => update("metaAdAccountId", next)}
            placeholder="act_123456789"
            value={value.metaAdAccountId}
          />
          <div className="lg:col-span-2">
            <TextField
              label="Google Ads Sheet URL"
              onChange={(next) => update("googleAdsSheetUrl", next)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={value.googleAdsSheetUrl}
            />
          </div>
          <GoogleAdsScriptModal sheetUrl={value.googleAdsSheetUrl} />
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Note interne
            </span>
            <textarea
              className="focus-ring min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) => update("notes", event.target.value)}
              value={value.notes}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Monthly insights</h2>
        <div className="grid gap-4">
          <TextField
            label="Luna"
            onChange={(next) => update("insightMonth", next)}
            type="month"
            value={value.insightMonth}
          />
          <TextAreaField
            label="Ce a mers bine"
            onChange={(next) => update("whatWentWell", next)}
            value={value.whatWentWell}
          />
          <TextAreaField
            label="Ce necesita atentie"
            onChange={(next) => update("whatNeedsAttention", next)}
            value={value.whatNeedsAttention}
          />
          <TextAreaField
            label="Actiuni recomandate"
            onChange={(next) => update("recommendedNextActions", next)}
            value={value.recommendedNextActions}
          />
        </div>
      </section>

      {mode === "edit" ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-2 text-lg font-semibold text-slate-950">Link raport</h2>
          <p className="mb-4 text-sm text-slate-600">
            Genereaza un link secret nou pentru client. Linkurile vechi nu vor mai
            functiona.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="focus-ring rounded-md border border-digital px-4 py-2 text-sm font-semibold text-digital hover:bg-digital-mist"
              onClick={generateShareLink}
              type="button"
            >
              Genereaza link secret
            </button>
            {initialValue?.hasShareToken ? (
              <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                Clientul are deja un link activ
              </span>
            ) : null}
          </div>
          {shareUrl ? (
            <input
              className="mt-4 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              readOnly
              value={shareUrl}
            />
          ) : null}
        </section>
      ) : null}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {mode === "edit" ? (
          <button
            className="focus-ring rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            onClick={deleteClient}
            type="button"
          >
            Sterge client
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button
            className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-digital hover:text-digital"
            onClick={() => router.push("/admin/clients")}
            type="button"
          >
            Anuleaza
          </button>
          <button
            className="focus-ring rounded-md bg-digital px-4 py-2 text-sm font-semibold text-white hover:bg-digital-ink"
            disabled={pending}
            type="submit"
          >
            {pending ? "Se salveaza..." : "Salveaza"}
          </button>
        </div>
      </div>
    </form>
  );
}

function TextField({
  help,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {help ? <span className="mt-1 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="focus-ring min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
