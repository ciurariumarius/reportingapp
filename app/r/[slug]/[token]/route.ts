import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: `/r/${slug}`,
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}
