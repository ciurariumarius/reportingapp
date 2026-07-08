import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const MAX_LOGO_BYTES = 1_000_000;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg"
};

function safeFilenamePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const client = await prisma.client.findUnique({
    where: { slug },
    select: { id: true, slug: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu există." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Alege un fișier logo." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Logo-ul trebuie să fie PNG, JPG, WEBP sau SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      { error: "Logo-ul trebuie să fie sub 1 MB." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "client-logos");
  const filename = `${safeFilenamePart(client.slug)}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, filename);
  const logoUrl = `/uploads/client-logos/${filename}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, bytes);

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: { logoUrl }
  });

  return NextResponse.json({
    ok: true,
    logoUrl: updatedClient.logoUrl,
    message: "Logo încărcat și salvat."
  });
}
