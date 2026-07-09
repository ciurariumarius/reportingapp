import { NextResponse } from "next/server";
import { requireAdminMutation, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { testMetaTokenStatus } from "@/lib/reporting/meta-token";

async function fallbackAdAccountId(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    metaAdAccountId?: string;
  };
  const fromBody = body.metaAdAccountId?.trim();

  if (fromBody) {
    return fromBody;
  }

  const client = await prisma.client.findFirst({
    where: {
      metaAdAccountId: {
        not: null
      }
    },
    orderBy: {
      name: "asc"
    },
    select: {
      metaAdAccountId: true
    }
  });

  return client?.metaAdAccountId ?? null;
}

export async function POST(request: Request) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  try {
    const result = await testMetaTokenStatus({
      fallbackAdAccountId: await fallbackAdAccountId(request)
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
