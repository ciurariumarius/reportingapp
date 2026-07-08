import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { testMetaConnection } from "@/lib/reporting/meta";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    metaAdAccountId?: string;
  };
  const client = await prisma.client.findUnique({
    where: { slug },
    select: { metaAdAccountId: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
  }

  const result = await testMetaConnection(
    body.metaAdAccountId?.trim() || client.metaAdAccountId
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
