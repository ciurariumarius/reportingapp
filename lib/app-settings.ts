import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getAuthSecret } from "./security/sessions";
import type { AdminSettingsPayload } from "./validation";

export type SettingSource = "admin" | "env" | "default" | "missing";

export type ServerSettingKey =
  | "NEXT_PUBLIC_APP_URL"
  | "META_ACCESS_TOKEN"
  | "META_API_VERSION"
  | "META_APP_ID"
  | "META_APP_SECRET"
  | "REPORT_DEFAULT_PIN"
  | "GA4_CLIENT_EMAIL"
  | "GA4_PRIVATE_KEY";

type SettingDefinition = {
  key: ServerSettingKey;
  label: string;
  description: string;
  group: "app" | "meta" | "ga4";
  required: boolean;
  sensitive: boolean;
  defaultValue?: string;
};

export type SettingSnapshotItem = SettingDefinition & {
  configured: boolean;
  displayValue: string;
  source: SettingSource;
};

const ENCRYPTION_PREFIX = "v1";

export const settingDefinitions: SettingDefinition[] = [
  {
    key: "NEXT_PUBLIC_APP_URL",
    label: "Public app URL",
    description: "Domeniul public folosit pentru linkuri de raport si privacy policy.",
    group: "app",
    required: true,
    sensitive: false
  },
  {
    key: "META_ACCESS_TOKEN",
    label: "Meta access token",
    description: "Token de System User cu permisiunea ads_read pentru Marketing API.",
    group: "meta",
    required: true,
    sensitive: true
  },
  {
    key: "META_API_VERSION",
    label: "Meta API version",
    description: "Versiunea Graph API folosita pentru Ads Insights.",
    group: "meta",
    required: true,
    sensitive: false,
    defaultValue: "v23.0"
  },
  {
    key: "META_APP_ID",
    label: "Meta app ID",
    description: "Necesar impreuna cu app secret pentru validarea tokenului prin debug_token.",
    group: "meta",
    required: false,
    sensitive: false
  },
  {
    key: "META_APP_SECRET",
    label: "Meta app secret",
    description: "Optional. Cand este setat, cererile includ appsecret_proof.",
    group: "meta",
    required: false,
    sensitive: true
  },
  {
    key: "REPORT_DEFAULT_PIN",
    label: "PIN global rapoarte",
    description: "PIN implicit pentru accesul la rapoarte cand clientul nu are override.",
    group: "app",
    required: true,
    sensitive: true,
    defaultValue: "2657"
  },
  {
    key: "GA4_CLIENT_EMAIL",
    label: "GA4 service account email",
    description: "Email-ul service account-ului adaugat ca Viewer in proprietatile GA4.",
    group: "ga4",
    required: true,
    sensitive: false
  },
  {
    key: "GA4_PRIVATE_KEY",
    label: "GA4 private key",
    description: "Cheia privata a service account-ului GA4.",
    group: "ga4",
    required: true,
    sensitive: true
  }
];

function encryptionKey() {
  return createHash("sha256").update(getAuthSecret()).digest();
}

function encryptSettingValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}

function decryptSettingValue(value: string) {
  if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    return value;
  }

  const [, iv, tag, encrypted] = value.split(":");
  if (!iv || !tag || !encrypted) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return null;
  }
}

function canReadDatabaseSettings() {
  return process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);
}

function isMissingSettingsTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function readStoredSetting(key: ServerSettingKey) {
  if (!canReadDatabaseSettings()) {
    return null;
  }

  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    if (!setting) {
      return null;
    }

    const value = setting.sensitive ? decryptSettingValue(setting.value) : setting.value;
    return value?.trim() ? value : null;
  } catch (error) {
    if (isMissingSettingsTable(error)) {
      return null;
    }

    console.error(`Could not read app setting ${key}`, error);
    return null;
  }
}

async function writeStoredSetting(
  key: ServerSettingKey,
  value: string | null,
  sensitive: boolean
) {
  if (!value?.trim()) {
    await prisma.appSetting.deleteMany({ where: { key } });
    return;
  }

  const storedValue = sensitive ? encryptSettingValue(value.trim()) : value.trim();

  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: storedValue, sensitive },
    update: { value: storedValue, sensitive }
  });
}

function envValue(key: ServerSettingKey) {
  const value = process.env[key]?.trim();
  return value || null;
}

export async function resolveServerSetting(key: ServerSettingKey) {
  const definition = settingDefinitions.find((setting) => setting.key === key);
  const stored = await readStoredSetting(key);

  if (stored) {
    return { value: stored, source: "admin" as const };
  }

  const fromEnv = envValue(key);
  if (fromEnv) {
    return { value: fromEnv, source: "env" as const };
  }

  if (definition?.defaultValue) {
    return { value: definition.defaultValue, source: "default" as const };
  }

  return { value: null, source: "missing" as const };
}

export async function getServerSetting(key: ServerSettingKey) {
  return (await resolveServerSetting(key)).value;
}

function displayValue(value: string | null, sensitive: boolean) {
  if (!value) {
    return "Lipsa";
  }

  return sensitive ? "Setat" : value;
}

export async function getAdminSettingsSnapshot() {
  const items = await Promise.all(
    settingDefinitions.map(async (definition) => {
      const resolved = await resolveServerSetting(definition.key);

      return {
        ...definition,
        configured: Boolean(resolved.value),
        displayValue: displayValue(resolved.value, definition.sensitive),
        source: resolved.source
      };
    })
  );

  return items;
}

export async function getPublicAppUrl() {
  return (await getServerSetting("NEXT_PUBLIC_APP_URL"))?.replace(/\/+$/, "") || "";
}

export async function saveAdminSettings(payload: AdminSettingsPayload) {
  const values: Array<[ServerSettingKey, string | null | undefined, boolean]> = [
    ["NEXT_PUBLIC_APP_URL", payload.publicAppUrl, false],
    ["META_API_VERSION", payload.metaApiVersion, false],
    ["META_APP_ID", payload.metaAppId, false],
    ["GA4_CLIENT_EMAIL", payload.ga4ClientEmail, false]
  ];

  if (payload.reportDefaultPin?.trim()) {
    values.push(["REPORT_DEFAULT_PIN", payload.reportDefaultPin, true]);
  }

  if (payload.metaAccessToken?.trim()) {
    values.push(["META_ACCESS_TOKEN", payload.metaAccessToken, true]);
  }

  if (payload.ga4PrivateKey?.trim()) {
    values.push(["GA4_PRIVATE_KEY", payload.ga4PrivateKey, true]);
  }

  if (payload.clearMetaAppSecret) {
    values.push(["META_APP_SECRET", null, true]);
  } else if (payload.metaAppSecret?.trim()) {
    values.push(["META_APP_SECRET", payload.metaAppSecret, true]);
  }

  for (const [key, value, sensitive] of values) {
    await writeStoredSetting(key, value ?? null, sensitive);
  }
}
