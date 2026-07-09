import "server-only";

import { createHmac } from "node:crypto";
import { getServerSetting } from "../app-settings";
import { normalizeMetaAdAccountId } from "./meta";
import type { AdminSettingsPayload } from "../validation";

export type MetaTokenStatus =
  | "missing_config"
  | "valid_never_expires"
  | "valid_expiring"
  | "fallback_valid"
  | "invalid"
  | "error";

export type MetaTokenCheckResult = {
  ok: boolean;
  status: MetaTokenStatus;
  message: string;
  checkedWith: "debug_token" | "ad_account_fallback" | "none";
  appIdConfigured: boolean;
  appSecretConfigured: boolean;
  expiresAt?: string;
  tokenType?: string;
  appId?: string;
  scopes?: string[];
  adAccountId?: string;
};

type MetaTokenCheckOptions = {
  fallbackAdAccountId?: string | null;
  tokenOverride?: string | null;
  apiVersionOverride?: string | null;
  appIdOverride?: string | null;
  appSecretOverride?: string | null;
  ignoreStoredAppSecret?: boolean;
};

type MetaApiErrorShape = {
  code?: number;
  message?: string;
  type?: string;
};

type MetaDebugTokenData = {
  app_id?: string;
  application?: string;
  data_access_expires_at?: number;
  error?: MetaApiErrorShape;
  expires_at?: number;
  granular_scopes?: Array<{ scope?: string }>;
  is_valid?: boolean;
  scopes?: string[];
  type?: string;
};

export type MetaDebugTokenResponse = {
  data?: MetaDebugTokenData;
  error?: MetaApiErrorShape;
};

type MetaGraphResponse<T> = {
  data?: T[];
  error?: MetaApiErrorShape;
};

function normalizeApiVersion(value: string | null | undefined) {
  const version = value?.trim() || "v23.0";
  return version.startsWith("v") ? version : `v${version}`;
}

function appSecretProof(accessToken: string, appSecret?: string | null) {
  if (!appSecret?.trim()) {
    return undefined;
  }

  return createHmac("sha256", appSecret.trim()).update(accessToken).digest("hex");
}

function graphUrl(
  apiVersion: string,
  path: string,
  params: Record<string, string | number | undefined>
) {
  const url = new URL(
    `https://graph.facebook.com/${apiVersion}/${path.replace(/^\/+/, "")}`
  );

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function isTokenError(error?: MetaApiErrorShape) {
  const message = error?.message?.toLowerCase() || "";
  return error?.code === 190 || /token|oauth|session|expired/.test(message);
}

function collectScopes(data: MetaDebugTokenData) {
  const scopes = new Set<string>();

  for (const scope of data.scopes ?? []) {
    if (scope) scopes.add(scope);
  }

  for (const scope of data.granular_scopes ?? []) {
    if (scope.scope) scopes.add(scope.scope);
  }

  return [...scopes].sort();
}

function baseResult(
  overrides: Partial<MetaTokenCheckResult> & Pick<MetaTokenCheckResult, "status">
): MetaTokenCheckResult {
  return {
    ok: false,
    message: "Tokenul Meta nu a putut fi verificat.",
    checkedWith: "none",
    appIdConfigured: false,
    appSecretConfigured: false,
    ...overrides
  };
}

export function parseDebugTokenResponse(
  response: MetaDebugTokenResponse,
  context: {
    appIdConfigured?: boolean;
    appSecretConfigured?: boolean;
  } = {}
): MetaTokenCheckResult {
  const config = {
    appIdConfigured: Boolean(context.appIdConfigured),
    appSecretConfigured: Boolean(context.appSecretConfigured)
  };

  if (response.error) {
    return baseResult({
      ...config,
      checkedWith: "debug_token",
      status: isTokenError(response.error) ? "invalid" : "error",
      message: isTokenError(response.error)
        ? "Tokenul Meta este invalid sau expirat."
        : "Meta debug_token nu a putut verifica tokenul."
    });
  }

  const data = response.data;
  if (!data || data.is_valid !== true) {
    return baseResult({
      ...config,
      checkedWith: "debug_token",
      status: "invalid",
      message: "Tokenul Meta este invalid sau expirat.",
      ...(data?.type ? { tokenType: data.type } : {}),
      ...(data?.app_id ? { appId: data.app_id } : {}),
      ...(data ? { scopes: collectScopes(data) } : {})
    });
  }

  const shared = {
    ...config,
    checkedWith: "debug_token" as const,
    tokenType: data.type,
    appId: data.app_id,
    scopes: collectScopes(data)
  };
  const expiresAt = Number(data.expires_at || 0);

  if (expiresAt > 0) {
    const expiresAtIso = new Date(expiresAt * 1000).toISOString();

    if (expiresAt * 1000 <= Date.now()) {
      return baseResult({
        ...shared,
        status: "invalid",
        expiresAt: expiresAtIso,
        message: "Tokenul Meta este expirat."
      });
    }

    return baseResult({
      ...shared,
      status: "valid_expiring",
      expiresAt: expiresAtIso,
      message:
        "Token valid, dar expira. Genereaza un System User token cu Never expires."
    });
  }

  return baseResult({
    ...shared,
    ok: true,
    status: "valid_never_expires",
    message: "Token valid, fara expirare."
  });
}

async function settingsConfig(options: MetaTokenCheckOptions) {
  const [storedToken, storedVersion, storedAppId, storedAppSecret] = await Promise.all([
    getServerSetting("META_ACCESS_TOKEN"),
    getServerSetting("META_API_VERSION"),
    getServerSetting("META_APP_ID"),
    getServerSetting("META_APP_SECRET")
  ]);

  return {
    accessToken: options.tokenOverride?.trim() || storedToken?.trim() || null,
    apiVersion: normalizeApiVersion(
      options.apiVersionOverride?.trim() || storedVersion?.trim()
    ),
    appId: options.appIdOverride?.trim() || storedAppId?.trim() || null,
    appSecret:
      options.appSecretOverride?.trim() ||
      (options.ignoreStoredAppSecret ? null : storedAppSecret?.trim() || null)
  };
}

async function checkDebugToken(
  accessToken: string,
  apiVersion: string,
  appId: string,
  appSecret: string
) {
  const appAccessToken = `${appId}|${appSecret}`;
  const url = graphUrl(apiVersion, "debug_token", {
    input_token: accessToken,
    access_token: appAccessToken,
    appsecret_proof: appSecretProof(appAccessToken, appSecret)
  });
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as MetaDebugTokenResponse;

  if (!response.ok && !body.error) {
    return baseResult({
      status: "error",
      checkedWith: "debug_token",
      appIdConfigured: true,
      appSecretConfigured: true,
      message: "Meta debug_token nu a putut verifica tokenul."
    });
  }

  return parseDebugTokenResponse(body, {
    appIdConfigured: true,
    appSecretConfigured: true
  });
}

async function checkAdAccountFallback(
  accessToken: string,
  apiVersion: string,
  appSecret: string | null,
  fallbackAdAccountId: string | null | undefined
) {
  const adAccountId = normalizeMetaAdAccountId(fallbackAdAccountId);

  if (!adAccountId) {
    return baseResult({
      status: "missing_config",
      message:
        "Seteaza META_APP_ID si META_APP_SECRET sau un Meta ad account ID pentru testul fallback."
    });
  }

  const url = graphUrl(apiVersion, `${adAccountId}/insights`, {
    fields: "spend",
    date_preset: "last_7d",
    limit: 1,
    access_token: accessToken,
    appsecret_proof: appSecretProof(accessToken, appSecret)
  });
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as MetaGraphResponse<{
    spend?: string;
  }>;

  if (response.ok && !body.error) {
    return baseResult({
      ok: true,
      status: "fallback_valid",
      checkedWith: "ad_account_fallback",
      appSecretConfigured: Boolean(appSecret),
      adAccountId,
      message:
        "Tokenul functioneaza pe ad account, dar expirarea nu poate fi confirmata fara META_APP_ID si META_APP_SECRET."
    });
  }

  if (isTokenError(body.error)) {
    return baseResult({
      status: "invalid",
      checkedWith: "ad_account_fallback",
      appSecretConfigured: Boolean(appSecret),
      adAccountId,
      message: "Tokenul Meta este invalid sau expirat."
    });
  }

  return baseResult({
    status: "error",
    checkedWith: "ad_account_fallback",
    appSecretConfigured: Boolean(appSecret),
    adAccountId,
    message:
      "Tokenul Meta nu a putut fi verificat pe ad account. Verifica accesul si ID-ul contului."
  });
}

export async function testMetaTokenStatus(options: MetaTokenCheckOptions = {}) {
  const config = await settingsConfig(options);

  if (!config.accessToken) {
    return baseResult({
      status: "missing_config",
      appIdConfigured: Boolean(config.appId),
      appSecretConfigured: Boolean(config.appSecret),
      message: "Lipseste META_ACCESS_TOKEN."
    });
  }

  if (config.appId && config.appSecret) {
    return checkDebugToken(
      config.accessToken,
      config.apiVersion,
      config.appId,
      config.appSecret
    );
  }

  return checkAdAccountFallback(
    config.accessToken,
    config.apiVersion,
    config.appSecret,
    options.fallbackAdAccountId
  );
}

export async function validateMetaTokenBeforeSave(payload: AdminSettingsPayload) {
  if (!payload.metaAccessToken?.trim()) {
    return null;
  }

  const appSecretOverride = payload.clearMetaAppSecret ? null : payload.metaAppSecret;
  const result = await testMetaTokenStatus({
    tokenOverride: payload.metaAccessToken,
    apiVersionOverride: payload.metaApiVersion,
    appIdOverride: payload.metaAppId,
    appSecretOverride,
    ignoreStoredAppSecret: payload.clearMetaAppSecret
  });

  return result.status === "invalid" || result.status === "valid_expiring"
    ? result
    : null;
}
