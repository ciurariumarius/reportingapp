"use client";

import { Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { GoogleAdsScriptModal } from "./GoogleAdsScriptModal";

export type ClientFormValue = {
  name: string;
  slug: string;
  active: boolean;
  timezone: string;
  currency: string;
  locale: "ro" | "en";
  reportType: "lead" | "ecommerce";
  websiteUrl: string;
  logoUrl: string;
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
    websiteUrl: "",
    logoUrl: "",
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
  const [logoState, setLogoState] = useState<ConnectionTestState>({
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

  async function detectLogo() {
    if (mode !== "edit" || !initialValue?.slug) {
      setLogoState({
        status: "error",
        message: "Salvează clientul înainte de detectarea logo-ului."
      });
      return;
    }

    setLogoState({ status: "testing", message: "Caut logo-ul în website..." });

    const response = await fetch(
      `/api/admin/clients/${initialValue.slug}/logo-detect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ websiteUrl: value.websiteUrl })
      }
    );
    const data = (await response.json()) as {
      ok?: boolean;
      logoUrl?: string;
      websiteUrl?: string;
      message?: string;
      error?: string;
    };

    if (response.ok && data.ok && data.logoUrl) {
      update("logoUrl", data.logoUrl);
      if (data.websiteUrl) update("websiteUrl", data.websiteUrl);
    }

    setLogoState({
      status: response.ok && data.ok ? "success" : "error",
      message: data.message || data.error || "Nu am putut detecta logo-ul."
    });
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (mode !== "edit" || !initialValue?.slug) {
      setLogoState({
        status: "error",
        message: "Salvează clientul înainte de upload logo."
      });
      return;
    }

    setLogoState({ status: "testing", message: "Se încarcă logo-ul..." });

    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch(
      `/api/admin/clients/${initialValue.slug}/logo-upload`,
      {
        method: "POST",
        headers: csrfHeaders(),
        body: formData
      }
    );
    const data = (await response.json()) as {
      ok?: boolean;
      logoUrl?: string;
      message?: string;
      error?: string;
    };

    if (response.ok && data.ok && data.logoUrl) {
      update("logoUrl", data.logoUrl);
    }

    setLogoState({
      status: response.ok && data.ok ? "success" : "error",
      message: data.message || data.error || "Nu am putut încărca logo-ul."
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
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-950">Brand client</h2>
          <p className="text-sm text-slate-600">
            Logo-ul apare în cover-ul raportului public.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  help="Ex: https://client.ro. Folosit pentru detectarea automată a logo-ului."
                  label="Website client"
                  onChange={(next) => {
                    update("websiteUrl", next);
                    setLogoState({ status: "idle", message: "" });
                  }}
                  placeholder="https://client.ro"
                  value={value.websiteUrl}
                />
              </div>
              <IconActionButton
                disabled={mode !== "edit" || logoState.status === "testing"}
                icon={Search}
                loading={logoState.status === "testing"}
                onClick={detectLogo}
                title="Detectează logo din website"
              />
            </div>
            <TextField
              help="Poți lipi și manual URL-ul unui logo."
              label="Logo URL"
              onChange={(next) => {
                update("logoUrl", next);
                setLogoState({ status: "idle", message: "" });
              }}
              placeholder="https://client.ro/logo.svg"
              value={value.logoUrl}
            />
            <div>
              <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-digital px-3 py-2 text-sm font-semibold text-digital hover:bg-digital-mist">
                <Upload aria-hidden="true" className="h-4 w-4" />
                Upload logo
                <input
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  disabled={mode !== "edit" || logoState.status === "testing"}
                  onChange={uploadLogo}
                  type="file"
                />
              </label>
              {mode !== "edit" ? (
                <p className="mt-2 text-xs text-slate-500">
                  Upload-ul și detectarea automată sunt disponibile după salvarea
                  clientului.
                </p>
              ) : null}
            </div>
            <ConnectionStateBadge state={logoState} />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Preview logo</p>
            {value.logoUrl ? (
              <div className="flex h-28 items-center justify-center rounded-md border border-slate-200 bg-white p-4">
                <img
                  alt="Logo client"
                  className="max-h-full max-w-full object-contain"
                  src={value.logoUrl}
                />
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                Fără logo
              </div>
            )}
          </div>
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

function IconActionButton({
  disabled,
  icon: Icon,
  loading,
  onClick,
  title
}: {
  disabled: boolean;
  icon: typeof Search;
  loading: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-label={title}
      className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-digital text-digital hover:bg-digital-mist disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {loading ? (
        <span aria-hidden="true" className="text-sm font-semibold">
          ...
        </span>
      ) : (
        <Icon aria-hidden="true" className="h-4 w-4" />
      )}
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
