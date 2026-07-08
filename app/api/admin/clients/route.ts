import { NextResponse } from "next/server";
import { requireAdminApi, handleApiError, requireAdminMutation } from "@/lib/api";
import { clientDataFromPayload, publicClient } from "@/lib/clients";
import { prisma } from "@/lib/prisma";
import { clientPayloadSchema } from "@/lib/validation";

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" }
  });

  return NextResponse.json({ clients: clients.map(publicClient) });
}

export async function POST(request: Request) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  try {
    const payload = clientPayloadSchema.parse(await request.json());
    const client = await prisma.client.create({
      data: clientDataFromPayload(payload)
    });

    const freshClient = await prisma.client.findUniqueOrThrow({
      where: { id: client.id }
    });

    return NextResponse.json({ client: publicClient(freshClient) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
