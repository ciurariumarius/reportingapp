"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AdminSettingsFormProps = {
  initialValue: {
    publicAppUrl: string;
    metaApiVersion: string;
    metaAppId: string;
    ga4ClientEmail: string;
  };
};

type MetaTokenTestResult = {
  ok: boolean;
  status: string;
  message: string;
  checkedWith?: string;
  expiresAt?: string;
  tokenType?: string;
  scopes?: string[];
};

type MetaTokenTestState = {
  tone: "success" | "warning" | "error";
  result: MetaTokenTestResult;
};

function csrfHeaders(): Record<string, string> {
  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("dd_csrf_token="))
    ?.slice("dd_csrf_token=".length);

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}

export function AdminSettingsForm({ initialValue }: AdminSettingsFormProps) {
  const router = useRouter();
  const [publicAppUrl, setPublicAppUrl] = useState(initialValue.publicAppUrl);
  const [metaApiVersion, setMetaApiVersion] = useState(
    initialValue.metaApiVersion || "v23.0"
  );
  const [metaAppId, setMetaAppId] = useState(initialValue.metaAppId);
  const [ga4ClientEmail, setGa4ClientEmail] = useState(initialValue.ga4ClientEmail);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [clearMetaAppSecret, setClearMetaAppSecret] = useState(false);
  const [ga4PrivateKey, setGa4PrivateKey] = useState("");
  const [pending, setPending] = useState(false);
  const [testingMetaToken, setTestingMetaToken] = useState(false);
  const [metaTokenTest, setMetaTokenTest] = useState<MetaTokenTestState | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function metaTokenTone(result: MetaTokenTestResult): MetaTokenTestState["tone"] {
    if (result.status === "valid_never_expires") {
      return "success";
    }

    if (result.status === "valid_expiring" || result.status === "fallback_valid") {
      return "warning";
    }

    return "error";
  }

  async function testMetaToken() {
    setTestingMetaToken(true);
    setMetaTokenTest(null);
    setError("");
    setNotice("");

    const response = await fetch("/api/admin/settings/meta-token-test", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({})
    });
    const data = (await response.json().catch(() => ({}))) as
      | MetaTokenTestResult
      | { error?: string };

    setTestingMetaToken(false);

    if ("status" in data && "message" in data) {
      setMetaTokenTest({
        tone: metaTokenTone(data),
        result: data
      });
      return;
    }

    setMetaTokenTest({
      tone: "error",
      result: {
        ok: false,
        status: "error",
        message: data.error || "Nu am putut verifica tokenul Meta."
      }
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({
        publicAppUrl,
        metaAccessToken,
        metaApiVersion,
        metaAppId,
        metaAppSecret,
        clearMetaAppSecret,
        ga4ClientEmail,
        ga4PrivateKey
      })
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      issues?: string[];
      metaToken?: MetaTokenTestResult;
    };

    setPending(false);

    if (!response.ok) {
      if (data.metaToken) {
        setMetaTokenTest({
          tone: metaTokenTone(data.metaToken),
          result: data.metaToken
        });
      }
      setError(data.issues?.join(" ") || data.error || "Nu am putut salva setarile.");
      return;
    }

    setMetaAccessToken("");
    setMetaAppSecret("");
    setGa4PrivateKey("");
    setClearMetaAppSecret(false);
    setNotice("Setarile au fost salvate.");
    router.refresh();
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" onSubmit={onSubmit}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">Configurare globala</h2>
        <p className="mt-1 text-sm text-slate-600">
          Valorile salvate aici sunt folosite inaintea celor din .env. Campurile
          secrete raman goale dupa salvare.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TextField
          help="Ex: https://reports.agentie.ro. Necesar pentru linkurile folosite in Facebook App Dashboard."
          label="Public app URL"
          onChange={setPublicAppUrl}
          placeholder="https://reports.agentie.ro"
          value={publicAppUrl}
        />
        <TextField
          help="Ex: v23.0"
          label="Meta API version"
          onChange={setMetaApiVersion}
          placeholder="v23.0"
          required
          value={metaApiVersion}
        />
        <TextField
          help="App ID-ul Meta folosit pentru debug_token si verificarea expirarii."
          label="Meta app ID"
          onChange={setMetaAppId}
          placeholder="123456789012345"
          value={metaAppId}
        />
        <SecretField
          help="Token System User cu ads_read. Lasa gol ca sa pastrezi valoarea curenta."
          label="Meta access token"
          onChange={setMetaAccessToken}
          placeholder="EA..."
          value={metaAccessToken}
        />
        <div>
          <SecretField
            help="Optional. Lasa gol ca sa pastrezi valoarea curenta."
            label="Meta app secret"
            onChange={(next) => {
              setMetaAppSecret(next);
              if (next) setClearMetaAppSecret(false);
            }}
            placeholder="App secret"
            value={metaAppSecret}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              checked={clearMetaAppSecret}
              className="h-4 w-4 rounded border-slate-300"
              disabled={Boolean(metaAppSecret)}
              onChange={(event) => setClearMetaAppSecret(event.target.checked)}
              type="checkbox"
            />
            Sterge Meta app secret salvat in admin
          </label>
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Status Meta token
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Verificarea foloseste tokenul salvat si nu expune tokenul sau secretul.
              </p>
            </div>
            <button
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-digital px-3 py-2 text-sm font-semibold text-digital hover:bg-digital-mist disabled:cursor-not-allowed disabled:opacity-60"
              disabled={testingMetaToken}
              onClick={testMetaToken}
              type="button"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              {testingMetaToken ? "Se verifica..." : "Verifica Meta token"}
            </button>
          </div>
          {metaTokenTest ? <MetaTokenStatus state={metaTokenTest} /> : null}
        </div>
        <TextField
          help="Adauga acest email ca Viewer sau mai sus in GA4 Property Access Management."
          label="GA4 service account email"
          onChange={setGa4ClientEmail}
          placeholder="service-account@project.iam.gserviceaccount.com"
          value={ga4ClientEmail}
        />
        <TextareaField
          help="Accepta cheia cu newline real sau cu \\n. Lasa gol ca sa pastrezi valoarea curenta."
          label="GA4 private key"
          onChange={setGa4PrivateKey}
          placeholder="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
          value={ga4PrivateKey}
        />
      </div>

      {error ? (
        <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {notice ? (
        <p className="mt-5 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          className="focus-ring rounded-md bg-digital px-4 py-2 text-sm font-semibold text-white hover:bg-digital-ink"
          disabled={pending}
          type="submit"
        >
          {pending ? "Se salveaza..." : "Salveaza settings"}
        </button>
      </div>
    </form>
  );
}

function MetaTokenStatus({ state }: { state: MetaTokenTestState }) {
  const toneClass = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800"
  }[state.tone];
  const details = [
    state.result.checkedWith ? `Metoda: ${state.result.checkedWith}` : null,
    state.result.tokenType ? `Tip: ${state.result.tokenType}` : null,
    state.result.expiresAt ? `Expira: ${state.result.expiresAt}` : null
  ].filter(Boolean);
  const scopes = state.result.scopes?.slice(0, 12) ?? [];

  return (
    <div className={`mt-3 rounded-md border px-3 py-2 text-sm ${toneClass}`}>
      <div className="font-semibold">{state.result.message}</div>
      {details.length ? (
        <div className="mt-1 text-xs opacity-90">{details.join(" / ")}</div>
      ) : null}
      {scopes.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scopes.map((scope) => (
            <span
              className="rounded border border-current px-2 py-0.5 text-xs opacity-90"
              key={scope}
            >
              {scope}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TextField({
  help,
  label,
  onChange,
  placeholder,
  required,
  value
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
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
        type="text"
        value={value}
      />
      {help ? <span className="mt-1 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}

function SecretField(props: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{props.label}</span>
      <input
        autoComplete="off"
        className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2"
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        type="password"
        value={props.value}
      />
      {props.help ? (
        <span className="mt-1 block text-xs text-slate-500">{props.help}</span>
      ) : null}
    </label>
  );
}

function TextareaField({
  help,
  label,
  onChange,
  placeholder,
  value
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        autoComplete="off"
        className="focus-ring min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {help ? <span className="mt-1 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}
