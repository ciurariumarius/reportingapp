import { NextResponse } from "next/server";
import { requireAdminApi, handleApiError } from "@/lib/api";
import { clientDataFromPayload, publicClient } from "@/lib/clients";
import { prisma } from "@/lib/prisma";
import { clientPayloadSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { slug } = await context.params;
  const client = await prisma.client.findUnique({
    where: { slug },
    include: {
      monthlyInsights: {
        orderBy: { month: "desc" },
        take: 12
      }
    }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
  }

  return NextResponse.json({ client: publicClient(client) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { slug } = await context.params;
    const payload = clientPayloadSchema.parse(await request.json());
    const existing = await prisma.client.findUnique({ where: { slug } });

    if (!existing) {
      return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id: existing.id },
      data: clientDataFromPayload(payload)
    });

    if (payload.insightMonth) {
      await prisma.monthlyInsight.upsert({
        where: {
          clientId_month: {
            clientId: client.id,
            month: payload.insightMonth
          }
        },
        update: {
          whatWentWell: payload.whatWentWell ?? "",
          whatNeedsAttention: payload.whatNeedsAttention ?? "",
          recommendedNextActions: payload.recommendedNextActions ?? ""
        },
        create: {
          clientId: client.id,
          month: payload.insightMonth,
          whatWentWell: payload.whatWentWell ?? "",
          whatNeedsAttention: payload.whatNeedsAttention ?? "",
          recommendedNextActions: payload.recommendedNextActions ?? ""
        }
      });
    }

    const freshClient = await prisma.client.findUniqueOrThrow({
      where: { id: client.id },
      include: {
        monthlyInsights: {
          orderBy: { month: "desc" },
          take: 12
        }
      }
    });

    return NextResponse.json({ client: publicClient(freshClient) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { slug } = await context.params;
  await prisma.client.delete({
    where: { slug }
  });

  return NextResponse.json({ ok: true });
}
