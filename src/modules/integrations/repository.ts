import { Prisma } from "@prisma/client";
import { prisma } from "../../services/prisma";
import {
  defaultIntegrationConfigs,
  type IntegrationConfigView,
  type IntegrationLogView,
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

type IntegrationLogRecord = {
  id: string;
  provider: IntegrationProvider;
  action: string;
  status: string;
  message: string;
  metadataJson: unknown;
  createdAt: Date;
};

export async function listIntegrationConfigs(): Promise<IntegrationConfigView[]> {
  await seedDefaultIntegrationConfigs();

  const rows = (await prisma.integrationConfig.findMany({
    orderBy: {
      provider: "asc"
    }
  })) as IntegrationConfigRecord[];
  const rowByProvider = new Map(rows.map((row) => [row.provider, row]));

  return Object.keys(defaultIntegrationConfigs)
    .map((provider) => rowByProvider.get(provider as IntegrationProvider))
    .filter((row): row is IntegrationConfigRecord => Boolean(row))
    .map(toIntegrationConfigView);
}

export async function getIntegrationConfig(
  provider: IntegrationProvider
): Promise<IntegrationConfigView> {
  await seedDefaultIntegrationConfigs();

  const row = (await prisma.integrationConfig.findUnique({
    where: {
      provider
    }
  })) as IntegrationConfigRecord | null;

  if (!row) {
    throw new Error(`Integration config not found after seed: ${provider}`);
  }

  return toIntegrationConfigView(row);
}

export async function upsertIntegrationConfig(
  provider: IntegrationProvider,
  input: UpdateIntegrationInput
): Promise<IntegrationConfigView> {
  const defaults = defaultIntegrationConfigs[provider];
  const createData = {
    displayName: input.displayName ?? defaults.displayName,
    status: input.status ?? defaults.status,
    authType: input.authType ?? defaults.authType,
    credentialsJson: toPrismaJson(input.credentialsJson ?? {}),
    settingsJson: toPrismaJson(input.settingsJson ?? defaults.settingsJson)
  };
  const updateData = compactUndefined({
    displayName: input.displayName,
    status: input.status,
    authType: input.authType,
    credentialsJson: input.credentialsJson === undefined
      ? undefined
      : toPrismaJson(input.credentialsJson),
    settingsJson: input.settingsJson === undefined
      ? undefined
      : toPrismaJson(input.settingsJson)
  });

  const row = (await prisma.integrationConfig.upsert({
    where: {
      provider
    },
    create: {
      provider,
      ...createData
    },
    update: updateData
  })) as IntegrationConfigRecord;

  return toIntegrationConfigView(row);
}

export async function listIntegrationLogs(
  provider?: IntegrationProvider
): Promise<IntegrationLogView[]> {
  const rows = provider
    ? await prisma.$queryRaw<IntegrationLogRecord[]>`
        SELECT
          "id",
          "provider",
          "action",
          "status",
          "message",
          "metadataJson",
          "createdAt"
        FROM "integration_logs"
        WHERE "provider" = ${provider}::"IntegrationProvider"
        ORDER BY "createdAt" DESC
        LIMIT 100
      `
    : await prisma.$queryRaw<IntegrationLogRecord[]>`
        SELECT
          "id",
          "provider",
          "action",
          "status",
          "message",
          "metadataJson",
          "createdAt"
        FROM "integration_logs"
        ORDER BY "createdAt" DESC
        LIMIT 100
      `;

  return rows.map(toIntegrationLogView);
}

export async function createIntegrationLog(input: {
  provider: IntegrationProvider;
  action: string;
  status: string;
  message: string;
  metadataJson?: Record<string, unknown>;
}): Promise<IntegrationLogView> {
  const [row] = await prisma.$queryRaw<IntegrationLogRecord[]>`
    INSERT INTO "integration_logs" (
      "provider",
      "action",
      "status",
      "message",
      "metadataJson"
    )
    VALUES (
      ${input.provider}::"IntegrationProvider",
      ${input.action},
      ${input.status},
      ${input.message},
      ${toPrismaJson(input.metadataJson ?? {})}
    )
    RETURNING
      "id",
      "provider",
      "action",
      "status",
      "message",
      "metadataJson",
      "createdAt"
  `;

  if (!row) {
    throw new Error("Integration log was not created.");
  }

  return toIntegrationLogView(row);
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

async function seedDefaultIntegrationConfigs() {
  await prisma.integrationConfig.createMany({
    data: Object.entries(defaultIntegrationConfigs).map(([provider, defaults]) => ({
      provider: provider as IntegrationProvider,
      displayName: defaults.displayName,
      status: defaults.status,
      authType: defaults.authType,
      credentialsJson: toPrismaJson({}),
      settingsJson: toPrismaJson(defaults.settingsJson)
    })),
    skipDuplicates: true
  });
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

function toIntegrationLogView(row: IntegrationLogRecord): IntegrationLogView {
  return {
    id: row.id,
    provider: row.provider,
    action: row.action,
    status: row.status,
    message: row.message,
    metadataJson: row.metadataJson ?? {},
    createdAt: row.createdAt
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
