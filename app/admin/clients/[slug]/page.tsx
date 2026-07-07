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
    where: { slug },
    include: {
      monthlyInsights: {
        orderBy: { month: "desc" },
        take: 1
      }
    }
  });

  if (!client) {
    notFound();
  }

  const insight = client.monthlyInsights[0];

  return (
    <AdminShell description="Actualizeaza setarile clientului." title={client.name}>
      <ClientForm
        initialValue={{
          name: client.name,
          slug: client.slug,
          active: client.active,
          timezone: client.timezone,
          currency: client.currency,
          locale: client.locale === "en" ? "en" : "ro",
          ga4PropertyId: client.ga4PropertyId ?? "",
          metaAdAccountId: client.metaAdAccountId ?? "",
          googleAdsSheetUrl: client.googleAdsSheetUrl ?? "",
          notes: client.notes ?? "",
          hasShareToken: Boolean(client.shareTokenHash),
          insightMonth: insight?.month ?? new Date().toISOString().slice(0, 7),
          whatWentWell: insight?.whatWentWell ?? "",
          whatNeedsAttention: insight?.whatNeedsAttention ?? "",
          recommendedNextActions: insight?.recommendedNextActions ?? ""
        }}
        mode="edit"
      />
    </AdminShell>
  );
}
