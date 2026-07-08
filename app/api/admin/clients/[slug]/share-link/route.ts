import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const client = await prisma.client.findUniqueOrThrow({
    where: { slug },
    select: { slug: true }
  });

  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const requestOrigin = new URL(request.url).origin;
  const baseUrl = configuredBaseUrl || requestOrigin;
  const url = `${baseUrl}/r/${client.slug}`;

  return NextResponse.json({ url });
}
