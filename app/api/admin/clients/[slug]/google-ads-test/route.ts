import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { testGoogleAdsSheetConnection } from "@/lib/reporting/google-ads-sheet";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    googleAdsSheetUrl?: string;
  };
  const client = await prisma.client.findUnique({
    where: { slug },
    select: { googleAdsSheetUrl: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
  }

  const result = await testGoogleAdsSheetConnection(
    body.googleAdsSheetUrl?.trim() || client.googleAdsSheetUrl
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
