import { NextResponse } from "next/server";
import { requireAdminMutation, handleApiError } from "@/lib/api";
import { saveAdminSettings } from "@/lib/app-settings";
import { validateMetaTokenBeforeSave } from "@/lib/reporting/meta-token";
import { adminSettingsPayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  try {
    const payload = adminSettingsPayloadSchema.parse(await request.json());
    const metaTokenError = await validateMetaTokenBeforeSave(payload);
    if (metaTokenError) {
      return NextResponse.json(
        {
          error: metaTokenError.message,
          metaToken: metaTokenError
        },
        { status: 400 }
      );
    }

    await saveAdminSettings(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
