import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireAdminPage();

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <AdminShell
      description="Configureaza clientii, sursele de date si linkurile de raport."
      title="Clienti"
    >
      <div className="mb-5 flex justify-end">
        <Link
          className="focus-ring rounded-md bg-digital px-4 py-2 text-sm font-semibold text-white hover:bg-digital-ink"
          href="/admin/clients/new"
        >
          Client nou
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Surse</th>
              <th className="px-4 py-3 text-right">Actiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length ? (
              clients.map((client) => (
                <tr key={client.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-950">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>GA4: {client.ga4PropertyId ? "configurat" : "lipsa"}</div>
                    <div>Meta: {client.metaAdAccountId ? "configurat" : "lipsa"}</div>
                    <div>
                      Google Ads: {client.googleAdsSheetUrl ? "configurat" : "lipsa"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-digital hover:text-digital"
                      href={`/admin/clients/${client.slug}`}
                    >
                      Editeaza
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={3}>
                  Nu exista clienti inca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
