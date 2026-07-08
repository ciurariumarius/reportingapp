import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { ClientForm } from "@/components/ClientForm";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditClientPage({ params }: PageProps) {
  await requireAdminPage();
  const { slug } = await params;
  const client = await prisma.client.findUnique({
    where: { slug }
  });

  if (!client) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const reportUrl = appUrl ? `${appUrl}/r/${client.slug}` : `/r/${client.slug}`;

  return (
    <AdminShell description="Actualizeaza setarile clientului." title={client.name}>
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-2 text-lg font-semibold text-slate-950">Link raport</h2>
        <p className="mb-4 text-sm text-slate-600">
          Link public neindexabil. Oricine are linkul poate vedea raportul live.
        </p>
        <a
          className="focus-ring block break-all rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-digital hover:border-digital"
          href={reportUrl}
          target="_blank"
        >
          {reportUrl}
        </a>
      </section>
      <ClientForm
        initialValue={{
          name: client.name,
          slug: client.slug,
          active: client.active,
          timezone: client.timezone,
          currency: client.currency,
          locale: client.locale === "en" ? "en" : "ro",
          reportType: client.reportType === "ecommerce" ? "ecommerce" : "lead",
          websiteUrl: client.websiteUrl ?? "",
          logoUrl: client.logoUrl ?? "",
          ga4PropertyId: client.ga4PropertyId ?? "",
          metaAdAccountId: client.metaAdAccountId ?? "",
          googleAdsSheetUrl: client.googleAdsSheetUrl ?? "",
          notes: client.notes ?? "",
          hasShareToken: Boolean(client.shareTokenHash)
        }}
        mode="edit"
      />
    </AdminShell>
  );
}
