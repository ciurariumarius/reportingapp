import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { testGa4Connection } from "@/lib/reporting/ga4";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    ga4PropertyId?: string;
  };
  const client = await prisma.client.findUnique({
    where: { slug },
    select: { ga4PropertyId: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
  }

  const result = await testGa4Connection(
    body.ga4PropertyId?.trim() || client.ga4PropertyId
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
