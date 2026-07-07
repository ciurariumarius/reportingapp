import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createRawToken, hashToken } from "@/lib/security/tokens";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { slug } = await context.params;
  const token = createRawToken();
  const client = await prisma.client.update({
    where: { slug },
    data: { shareTokenHash: hashToken(token) },
    select: { slug: true }
  });

  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const requestOrigin = new URL(request.url).origin;
  const baseUrl = configuredBaseUrl || requestOrigin;
  const url = `${baseUrl}/client/${client.slug}/report?token=${token}`;

  return NextResponse.json({ url });
}
