import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionCookie
} from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { verifyPassword } from "@/lib/security/passwords";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const expectedUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedUsername || !passwordHash) {
      return NextResponse.json(
        { error: "Admin login nu este configurat." },
        { status: 500 }
      );
    }

    const isValid =
      payload.username === expectedUsername &&
      verifyPassword(payload.password, passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Utilizator sau parola incorecta." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      ADMIN_COOKIE_NAME,
      createAdminSessionCookie(payload.username),
      adminCookieOptions
    );

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...adminCookieOptions,
    maxAge: 0
  });
  return response;
}
