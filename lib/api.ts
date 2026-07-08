import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminSession } from "./auth";
import { CSRF_COOKIE_NAME, verifyCsrfToken } from "./security/csrf";
import { getAuthSecret } from "./security/sessions";

export async function requireAdminApi() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Autentificare necesara." }, { status: 401 });
  }

  return null;
}

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  return cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function requireAdminMutation(request: Request) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const headerToken = request.headers.get("x-csrf-token") ?? undefined;
  const cookieToken = cookieValue(request, CSRF_COOKIE_NAME);
  const tokenIsValid =
    headerToken &&
    cookieToken &&
    headerToken === decodeURIComponent(cookieToken) &&
    verifyCsrfToken(headerToken, getAuthSecret());

  if (!tokenIsValid) {
    return NextResponse.json(
      { error: "Sesiunea admin nu a putut fi validata. Reincarca pagina si incearca din nou." },
      { status: 403 }
    );
  }

  return null;
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Date invalide.",
        issues: error.issues.map((issue) => issue.message)
      },
      { status: 400 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Exista deja un client cu acest slug." },
      { status: 409 }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "A aparut o eroare neasteptata." },
    { status: 500 }
  );
}
