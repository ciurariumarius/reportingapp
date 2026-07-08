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
  reportType: "lead" | "ecommerce";
  ga4PropertyId: string;
  metaAdAccountId: string;
  googleAdsSheetUrl: string;
  notes: string;
};

type ClientFormProps = {
  mode: "create" | "edit";
  initialValue?: Partial<ClientFormValue> & {
    hasShareToken?: boolean;
    reportUrl?: string;
  };
};

type ConnectionTestState = {
  status: "idle" | "testing" | "success" | "error";
  message: string;
};

function csrfHeaders(): Record<string, string> {
  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("dd_csrf_token="))
    ?.slice("dd_csrf_token=".length);

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "client"
  );
}

function defaultValue(): ClientFormValue {
  return {
    name: "",
    slug: "",
    active: true,
    timezone: "Europe/Bucharest",
    currency: "RON",
    locale: "ro",
    reportType: "lead",
    ga4PropertyId: "",
    metaAdAccountId: "",
    googleAdsSheetUrl: "",
    notes: ""
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
  const [ga4Test, setGa4Test] = useState<ConnectionTestState>({
    status: "idle",
    message: ""
  });
  const [googleAdsTest, setGoogleAdsTest] = useState<ConnectionTestState>({
    status: "idle",
    message: ""
  });
  const [metaTest, setMetaTest] = useState<ConnectionTestState>({
    status: "idle",
    message: ""
  });
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

    const payload = {
      ...value,
      slug:
        mode === "create"
          ? value.slug || slugify(value.name)
          : initialValue?.slug || value.slug,
      active: true,
      timezone: "Europe/Bucharest",
      notes: null
    };

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify(payload)
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

  async function deleteClient() {
    if (!window.confirm("Stergi acest client? Actiunea nu poate fi anulata.")) {
      return;
    }

    const response = await fetch(`/api/admin/clients/${initialValue?.slug}`, {
      method: "DELETE",
      headers: csrfHeaders()
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Nu am putut sterge clientul.");
      return;
    }

    router.push("/admin/clients");
    router.refresh();
  }

  async function testGa4() {
    if (mode !== "edit" || !initialValue?.slug) {
      setGa4Test({
        status: "error",
        message: "Salveaza clientul inainte de testarea conexiunii."
      });
      return;
    }

    setGa4Test({ status: "testing", message: "Se testeaza conexiunea GA4..." });

    const response = await fetch(
      `/api/admin/clients/${initialValue.slug}/ga4-test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ ga4PropertyId: value.ga4PropertyId })
      }
    );
    const data = (await response.json()) as {
      ok?: boolean;
      state?: { message?: string };
      error?: string;
    };

    setGa4Test({
      status: response.ok && data.ok ? "success" : "error",
      message:
        data.state?.message ||
        data.error ||
        "Nu am putut testa conexiunea GA4."
    });
  }

  async function testGoogleAds() {
    if (mode !== "edit" || !initialValue?.slug) {
      setGoogleAdsTest({
        status: "error",
        message: "Salveaza clientul inainte de testarea conexiunii."
      });
      return;
    }

    setGoogleAdsTest({
      status: "testing",
      message: "Se testeaza Google Ads Sheet..."
    });

    const response = await fetch(
      `/api/admin/clients/${initialValue.slug}/google-ads-test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ googleAdsSheetUrl: value.googleAdsSheetUrl })
      }
    );
    const data = (await response.json()) as {
      ok?: boolean;
      state?: { message?: string };
      error?: string;
    };

    setGoogleAdsTest({
      status: response.ok && data.ok ? "success" : "error",
      message:
        data.state?.message ||
        data.error ||
        "Nu am putut testa Google Ads Sheet."
    });
  }

  async function testMeta() {
    if (mode !== "edit" || !initialValue?.slug) {
      setMetaTest({
        status: "error",
        message: "Salveaza clientul inainte de testarea conexiunii."
      });
      return;
    }

    setMetaTest({
      status: "testing",
      message: "Se testeaza conexiunea Meta Ads..."
    });

    const response = await fetch(`/api/admin/clients/${initialValue.slug}/meta-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ metaAdAccountId: value.metaAdAccountId })
    });
    const data = (await response.json()) as {
      ok?: boolean;
      state?: { message?: string };
      error?: string;
    };

    setMetaTest({
      status: response.ok && data.ok ? "success" : "error",
      message:
        data.state?.message ||
        data.error ||
        "Nu am putut testa conexiunea Meta Ads."
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Nume client"
            onChange={(next) => {
              update("name", next);

              if (mode === "create") {
                update("slug", slugify(next));
              }
            }}
            required
            value={value.name}
          />
          <TextField
            label="Moneda"
            onChange={(next) => update("currency", next.toUpperCase())}
            value={value.currency}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Tip raport
            </span>
            <select
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) =>
                update("reportType", event.target.value as "lead" | "ecommerce")
              }
              value={value.reportType}
            >
              <option value="lead">Lead generation</option>
              <option value="ecommerce">Ecommerce</option>
            </select>
          </label>
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
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Surse de date</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  label="GA4 property ID"
                  onChange={(next) => {
                    update("ga4PropertyId", next);
                    setGa4Test({ status: "idle", message: "" });
                  }}
                  placeholder="properties/123456789"
                  value={value.ga4PropertyId}
                />
              </div>
              <IconTestButton
                disabled={mode !== "edit" || ga4Test.status === "testing"}
                loading={ga4Test.status === "testing"}
                onClick={testGa4}
                title="Testeaza conexiunea GA4"
              />
            </div>
            <div className="mt-2">
              <ConnectionStateBadge state={ga4Test} />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  label="Meta ad account ID"
                  onChange={(next) => {
                    update("metaAdAccountId", next);
                    setMetaTest({ status: "idle", message: "" });
                  }}
                  placeholder="act_123456789"
                  value={value.metaAdAccountId}
                />
              </div>
              <IconTestButton
                disabled={mode !== "edit" || metaTest.status === "testing"}
                loading={metaTest.status === "testing"}
                onClick={testMeta}
                title="Testeaza conexiunea Meta Ads"
              />
            </div>
            <div className="mt-2">
              <ConnectionStateBadge state={metaTest} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  label="Google Ads Sheet URL"
                  onChange={(next) => {
                    update("googleAdsSheetUrl", next);
                    setGoogleAdsTest({ status: "idle", message: "" });
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={value.googleAdsSheetUrl}
                />
              </div>
              <IconTestButton
                disabled={mode !== "edit" || googleAdsTest.status === "testing"}
                loading={googleAdsTest.status === "testing"}
                onClick={testGoogleAds}
                title="Testeaza Google Ads Sheet"
              />
            </div>
            <div className="mt-2">
              <ConnectionStateBadge state={googleAdsTest} />
            </div>
          </div>
          <GoogleAdsScriptModal sheetUrl={value.googleAdsSheetUrl} />
        </div>
      </section>

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

function IconTestButton({
  disabled,
  loading,
  onClick,
  title
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-label={title}
      className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-digital text-base font-semibold text-digital hover:bg-digital-mist disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span aria-hidden="true">{loading ? "..." : "↻"}</span>
    </button>
  );
}

function ConnectionStateBadge({ state }: { state: ConnectionTestState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "testing") {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-600">
        {state.message}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span aria-hidden="true">{state.status === "success" ? "✓" : "!"}</span>
      {state.message}
    </span>
  );
}
