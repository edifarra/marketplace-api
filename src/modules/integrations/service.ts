import {
  getDefaultIntegrationConfigView,
  getIntegrationConfig,
  listDefaultIntegrationConfigViews,
  listIntegrationConfigs,
  upsertIntegrationConfig
} from "./repository";
import type { UpdateIntegrationInput } from "./schemas";
import { env } from "../../config/env";
import { integrationProviders, type IntegrationConfigView, type IntegrationProvider } from "./types";

export type IntegrationDataSource = "database" | "memory";

export class IntegrationStorageUnavailableError extends Error {
  readonly statusCode = 503;

  constructor(cause?: unknown) {
    super("Banco de dados indisponivel para o Centro de Integracoes.");
    this.name = "IntegrationStorageUnavailableError";
    this.cause = cause;
  }
}

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return integrationProviders.includes(value as IntegrationProvider);
}

export async function listIntegrations(): Promise<{
  source: IntegrationDataSource;
  data: IntegrationConfigView[];
}> {
  try {
    return {
      source: "database",
      data: await listIntegrationConfigs()
    };
  } catch (error) {
    if (canUseDevelopmentFallback()) {
      return {
        source: "memory",
        data: listDefaultIntegrationConfigViews()
      };
    }

    throw new IntegrationStorageUnavailableError(error);
  }
}

export async function getIntegration(provider: IntegrationProvider): Promise<{
  source: IntegrationDataSource;
  data: IntegrationConfigView;
}> {
  try {
    return {
      source: "database",
      data: await getIntegrationConfig(provider)
    };
  } catch (error) {
    if (canUseDevelopmentFallback()) {
      return {
        source: "memory",
        data: getDefaultIntegrationConfigView(provider)
      };
    }

    throw new IntegrationStorageUnavailableError(error);
  }
}

export async function updateIntegration(provider: IntegrationProvider, input: UpdateIntegrationInput) {
  try {
    return await upsertIntegrationConfig(provider, input);
  } catch (error) {
    throw new IntegrationStorageUnavailableError(error);
  }
}

export async function testIntegration(provider: IntegrationProvider) {
  const result = await getIntegration(provider);

  return {
    provider,
    source: result.source,
    status: "not_implemented",
    message: "Teste real de integracao ainda nao foi implementado.",
    integration: result.data
  };
}

function canUseDevelopmentFallback() {
  return env.NODE_ENV === "development";
}
