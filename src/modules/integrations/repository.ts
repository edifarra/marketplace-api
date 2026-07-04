import { Prisma } from "@prisma/client";
import { prisma } from "../../services/prisma";
import {
  defaultIntegrationConfigs,
  type IntegrationConfigView,
  type IntegrationProvider
} from "./types";
import type { UpdateIntegrationInput } from "./schemas";

type IntegrationConfigRecord = {
  id: string;
  provider: IntegrationProvider;
  displayName: string;
  status: IntegrationConfigView["status"];
  authType: IntegrationConfigView["authType"];
  credentialsJson: unknown;
  settingsJson: unknown;
  lastConnectedAt: Date | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listIntegrationConfigs(): Promise<IntegrationConfigView[]> {
  const rows = (await prisma.integrationConfig.findMany({
    orderBy: {
      provider: "asc"
    }
  })) as IntegrationConfigRecord[];
  const rowByProvider = new Map(rows.map((row) => [row.provider, row]));

  return Object.keys(defaultIntegrationConfigs).map((provider) => {
    const typedProvider = provider as IntegrationProvider;
    const row = rowByProvider.get(typedProvider);
    return row ? toIntegrationConfigView(row) : defaultIntegrationConfigView(typedProvider);
  });
}

export async function getIntegrationConfig(
  provider: IntegrationProvider
): Promise<IntegrationConfigView> {
  const row = (await prisma.integrationConfig.findUnique({
    where: {
      provider
    }
  })) as IntegrationConfigRecord | null;

  return row ? toIntegrationConfigView(row) : defaultIntegrationConfigView(provider);
}

export async function upsertIntegrationConfig(
  provider: IntegrationProvider,
  input: UpdateIntegrationInput
): Promise<IntegrationConfigView> {
  const defaults = defaultIntegrationConfigs[provider];
  const data = {
    displayName: input.displayName ?? defaults.displayName,
    status: input.status ?? defaults.status,
    authType: input.authType ?? defaults.authType,
    credentialsJson: input.credentialsJson
      ? toPrismaJson(input.credentialsJson)
      : undefined,
    settingsJson: toPrismaJson(input.settingsJson ?? defaults.settingsJson)
  };

  const row = (await prisma.integrationConfig.upsert({
    where: {
      provider
    },
    create: {
      provider,
      ...data
    },
    update: compactUndefined(data)
  })) as IntegrationConfigRecord;

  return toIntegrationConfigView(row);
}

export function listDefaultIntegrationConfigViews(): IntegrationConfigView[] {
  return Object.keys(defaultIntegrationConfigs).map((provider) =>
    defaultIntegrationConfigView(provider as IntegrationProvider)
  );
}

export function getDefaultIntegrationConfigView(
  provider: IntegrationProvider
): IntegrationConfigView {
  return defaultIntegrationConfigView(provider);
}

function defaultIntegrationConfigView(provider: IntegrationProvider): IntegrationConfigView {
  const defaults = defaultIntegrationConfigs[provider];
  return {
    id: null,
    provider,
    displayName: defaults.displayName,
    status: defaults.status,
    authType: defaults.authType,
    settingsJson: defaults.settingsJson,
    hasCredentials: false,
    credentialKeys: [],
    lastConnectedAt: null,
    lastSyncAt: null,
    createdAt: null,
    updatedAt: null
  };
}

function toIntegrationConfigView(row: IntegrationConfigRecord): IntegrationConfigView {
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.displayName,
    status: row.status,
    authType: row.authType,
    settingsJson: row.settingsJson ?? {},
    hasCredentials: hasObjectKeys(row.credentialsJson),
    credentialKeys: credentialKeys(row.credentialsJson),
    lastConnectedAt: row.lastConnectedAt,
    lastSyncAt: row.lastSyncAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function credentialKeys(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value);
}

function hasObjectKeys(value: unknown) {
  return credentialKeys(value).length > 0;
}

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
