import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminSession } from "./auth";

export async function requireAdminApi() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Autentificare necesara." }, { status: 401 });
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
