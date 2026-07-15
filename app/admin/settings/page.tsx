import { headers } from "next/headers";
import Link from "next/link";
import { AdminSettingsForm } from "@/components/AdminSettingsForm";
import { AdminShell } from "@/components/AdminShell";
import {
  getAdminSettingsSnapshot,
  getPublicAppUrl,
  type SettingSnapshotItem,
  type SettingSource
} from "@/lib/app-settings";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

const sourceLabels: Record<SettingSource, string> = {
  admin: "Admin Settings",
  env: ".env",
  default: "Implicit",
  missing: "Lipsa"
};

function groupItems(items: SettingSnapshotItem[], group: SettingSnapshotItem["group"]) {
  return items.filter((item) => item.group === group);
}

function requestBaseUrl(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  if (!host) {
    return "";
  }

  const protocol = headerList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function settingDisplay(settings: SettingSnapshotItem[], key: SettingSnapshotItem["key"]) {
  const displayValue = settings.find((setting) => setting.key === key)?.displayValue;
  return displayValue === "Lipsa" ? "" : displayValue || "";
}

function settingConfigured(settings: SettingSnapshotItem[], key: SettingSnapshotItem["key"]) {
  return Boolean(settings.find((setting) => setting.key === key)?.configured);
}

export default async function AdminSettingsPage() {
  await requireAdminPage();

  const [settings, configuredAppUrl, headerList] = await Promise.all([
    getAdminSettingsSnapshot(),
    getPublicAppUrl(),
    headers()
  ]);
  const fallbackAppUrl = requestBaseUrl(headerList);
  const privacyBaseUrl = configuredAppUrl || fallbackAppUrl;
  const privacyUrl = privacyBaseUrl ? `${privacyBaseUrl}/privacy` : "/privacy";
  const initial = {
    publicAppUrl: configuredAppUrl,
    metaApiVersion:
      settings.find((setting) => setting.key === "META_API_VERSION")?.displayValue ||
      "v23.0",
    metaAppId: settingDisplay(settings, "META_APP_ID"),
    reportDefaultPinConfigured: settingConfigured(settings, "REPORT_DEFAULT_PIN"),
    ga4ClientEmail: settingDisplay(settings, "GA4_CLIENT_EMAIL"),
    metaAccessTokenConfigured: settingConfigured(settings, "META_ACCESS_TOKEN"),
    metaAppSecretConfigured: settingConfigured(settings, "META_APP_SECRET"),
    ga4PrivateKeyConfigured: settingConfigured(settings, "GA4_PRIVATE_KEY")
  };

  return (
    <AdminShell
      activeNav="settings"
      description="Credentiale globale pentru agentie, URL-uri publice si statusul integrarii."
      title="Settings"
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Privacy policy URL
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Pune acest URL in Facebook App Dashboard la Settings / Basic /
                Privacy Policy URL.
              </p>
            </div>
            <Link
              className="focus-ring rounded-md border border-digital px-3 py-2 text-sm font-semibold text-digital hover:bg-digital-mist"
              href="/privacy"
              target="_blank"
            >
              Deschide pagina
            </Link>
          </div>
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-digital">
            {privacyUrl}
          </div>
          {!configuredAppUrl ? (
            <p className="mt-2 text-sm text-amber-700">
              Pentru Facebook foloseste domeniul public HTTPS, nu localhost. Seteaza
              Public app URL mai jos pentru fiecare agentie.
            </p>
          ) : null}
        </section>

        <StatusSection items={groupItems(settings, "app")} title="App" />
        <StatusSection items={groupItems(settings, "meta")} title="Meta Ads" />
        <StatusSection items={groupItems(settings, "ga4")} title="GA4" />

        <AdminSettingsForm initialValue={initial} />

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">
            Replicare pentru alta agentie
          </h2>
          <div className="mt-3 grid gap-3 text-sm text-slate-600 lg:grid-cols-2">
            <p>
              In Settings salvezi credentialele globale ale agentiei: Meta token,
              versiune API, GA4 service account si domeniul public.
            </p>
            <p>
              In Clienti salvezi doar ID-urile specifice fiecarui client: GA4
              property ID, Meta ad account ID si Google Ads Sheet URL.
            </p>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{`NEXT_PUBLIC_APP_URL=https://reports.agentie.ro
META_ACCESS_TOKEN=EA...
META_API_VERSION=v23.0
META_APP_ID=123456789012345
META_APP_SECRET=
GA4_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GA4_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n`}
          </pre>
        </section>
      </div>
    </AdminShell>
  );
}

function StatusSection({
  items,
  title
}: {
  items: SettingSnapshotItem[];
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Setare</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Sursa</th>
            <th className="px-4 py-3">Detalii</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.key} className="align-top">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-950">{item.label}</div>
                <div className="text-xs text-slate-500">{item.key}</div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={[
                    "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
                    item.configured
                      ? "bg-emerald-50 text-emerald-700"
                      : item.required
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                  ].join(" ")}
                >
                  {item.configured ? "Setat" : item.required ? "Lipsa" : "Optional"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{sourceLabels[item.source]}</td>
              <td className="px-4 py-3 text-slate-600">
                <div>{item.displayValue}</div>
                <div className="mt-1 text-xs text-slate-500">{item.description}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
