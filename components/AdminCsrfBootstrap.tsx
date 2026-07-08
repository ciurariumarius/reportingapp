"use client";

import { useEffect } from "react";

function hasCsrfCookie() {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("dd_csrf_token="));
}

export function AdminCsrfBootstrap() {
  useEffect(() => {
    if (!hasCsrfCookie()) {
      void fetch("/api/admin/csrf", { method: "GET" });
    }
  }, []);

  return null;
}
