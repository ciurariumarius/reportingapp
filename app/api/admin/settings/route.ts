import { NextResponse } from "next/server";
import { requireAdminMutation, handleApiError } from "@/lib/api";
import { saveAdminSettings } from "@/lib/app-settings";
import { adminSettingsPayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  try {
    const payload = adminSettingsPayloadSchema.parse(await request.json());
    await saveAdminSettings(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
