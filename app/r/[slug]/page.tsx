import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportDashboard } from "@/components/ReportDashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicReportPage({ params }: PageProps) {
  const { slug } = await params;
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

  return (
    <ReportDashboard
      initialClientName={client.name}
      initialLocale={client.locale === "en" ? "en" : "ro"}
      slug={client.slug}
    />
  );
}
