import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/api";
import { detectLogoFromWebsite } from "@/lib/client-logo";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    websiteUrl?: string;
  };
  const client = await prisma.client.findUnique({
    where: { slug },
    select: { id: true, websiteUrl: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu există." }, { status: 404 });
  }

  const result = await detectLogoFromWebsite(body.websiteUrl || client.websiteUrl);

  if (!result.ok || !result.logoUrl) {
    return NextResponse.json(result, { status: 422 });
  }

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      websiteUrl: result.websiteUrl,
      logoUrl: result.logoUrl
    }
  });

  return NextResponse.json({
    ok: true,
    logoUrl: updatedClient.logoUrl,
    websiteUrl: updatedClient.websiteUrl,
    message: result.message
  });
}
