import { notFound, redirect } from "next/navigation";
import { ReportDashboard } from "@/components/ReportDashboard";
import { hasReportAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; access?: string }>;
};

export default async function ClientReportPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  if (query.token) {
    redirect(`/api/client/${slug}/access?token=${encodeURIComponent(query.token)}`);
  }

  const client = await prisma.client.findFirst({
    where: { slug, active: true },
    select: {
      name: true,
      slug: true,
      locale: true
    }
  });

  if (!client) {
    notFound();
  }

  const allowed = await hasReportAccess(slug);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-digital">
            DigitalDot
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">
            Acces restrictionat
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Foloseste linkul secret primit de la echipa DigitalDot pentru a deschide
            raportul.
          </p>
          {query.access === "denied" ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Linkul folosit nu este valid sau a fost regenerat.
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <ReportDashboard
      initialClientName={client.name}
      initialLocale={client.locale === "en" ? "en" : "ro"}
      slug={client.slug}
    />
  );
}
