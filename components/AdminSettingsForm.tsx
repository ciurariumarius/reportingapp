"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AdminSettingsFormProps = {
  initialValue: {
    publicAppUrl: string;
    metaApiVersion: string;
    ga4ClientEmail: string;
  };
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
  const [ga4ClientEmail, setGa4ClientEmail] = useState(initialValue.ga4ClientEmail);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [clearMetaAppSecret, setClearMetaAppSecret] = useState(false);
  const [ga4PrivateKey, setGa4PrivateKey] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
        metaAppSecret,
        clearMetaAppSecret,
        ga4ClientEmail,
        ga4PrivateKey
      })
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      issues?: string[];
    };

    setPending(false);

    if (!response.ok) {
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
