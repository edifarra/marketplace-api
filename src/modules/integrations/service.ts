import {
  createIntegrationLog,
  getDefaultIntegrationConfigView,
  getIntegrationConfig,
  listIntegrationLogs,
  listDefaultIntegrationConfigViews,
  listIntegrationConfigs,
  upsertIntegrationConfig
} from "./repository";
import type { UpdateIntegrationInput } from "./schemas";
import { env } from "../../config/env";
import {
  integrationProviders,
  type IntegrationConfigView,
  type IntegrationLogView,
  type IntegrationProvider,
  type IntegrationStatusView
} from "./types";

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
    const integration = await upsertIntegrationConfig(provider, input);
    await safeCreateIntegrationLog({
      provider,
      action: "integration.update",
      status: "success",
      message: "Integracao atualizada.",
      metadataJson: {
        updatedFields: Object.keys(input)
      }
    });
    return integration;
  } catch (error) {
    await safeCreateIntegrationLog({
      provider,
      action: "integration.update",
      status: "error",
      message: "Erro controlado ao atualizar integracao.",
      metadataJson: errorMetadata(error)
    });
    throw new IntegrationStorageUnavailableError(error);
  }
}

export async function testIntegration(provider: IntegrationProvider) {
  try {
    const result = await getIntegration(provider);
    const status = provider === "supabase" && result.source === "database"
      ? "success"
      : "not_implemented";
    const message = provider === "supabase" && result.source === "database"
      ? "Banco de dados acessivel para a integracao Supabase."
      : integrationTestMessages[provider];

    await safeCreateIntegrationLog({
      provider,
      action: "integration.test",
      status,
      message,
      metadataJson: {
        source: result.source
      }
    });

    return {
      provider,
      source: result.source,
      status,
      message,
      integration: result.data
    };
  } catch (error) {
    await safeCreateIntegrationLog({
      provider,
      action: "integration.test",
      status: "error",
      message: "Erro controlado ao testar integracao.",
      metadataJson: errorMetadata(error)
    });

    if (error instanceof IntegrationStorageUnavailableError) {
      throw error;
    }

    throw new IntegrationStorageUnavailableError(error);
  }
}

export async function getIntegrationStatus(
  provider: IntegrationProvider
): Promise<IntegrationStatusView> {
  const result = await getIntegration(provider);
  const {
    provider: integrationProvider,
    displayName,
    status,
    authType,
    hasCredentials,
    credentialKeys,
    lastConnectedAt,
    lastSyncAt,
    updatedAt
  } = result.data;

  return {
    provider: integrationProvider,
    displayName,
    status,
    authType,
    hasCredentials,
    credentialKeys,
    lastConnectedAt,
    lastSyncAt,
    updatedAt
  };
}

export async function listLogs(provider?: IntegrationProvider): Promise<{
  source: "database";
  data: IntegrationLogView[];
}> {
  try {
    return {
      source: "database",
      data: await listIntegrationLogs(provider)
    };
  } catch (error) {
    if (provider) {
      await safeCreateIntegrationLog({
        provider,
        action: "integration.logs.list",
        status: "error",
        message: "Erro controlado ao listar logs da integracao.",
        metadataJson: errorMetadata(error)
      });
    }

    throw new IntegrationStorageUnavailableError(error);
  }
}

const integrationTestMessages: Record<IntegrationProvider, string> = {
  shopee: "Teste real Shopee ainda nao implementado.",
  mercadolivre: "Teste real Mercado Livre ainda nao implementado.",
  tiny: "Teste real Tiny ainda nao implementado.",
  googledrive: "Teste real Google Drive ainda nao implementado.",
  cloudinary: "Teste real Cloudinary ainda nao implementado.",
  supabase: "Teste real Supabase ainda nao implementado."
};

async function safeCreateIntegrationLog(input: {
  provider: IntegrationProvider;
  action: string;
  status: string;
  message: string;
  metadataJson?: Record<string, unknown>;
}) {
  try {
    await createIntegrationLog(input);
  } catch {
    // Logging must not hide the original integration operation result.
  }
}

function errorMetadata(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    message: String(error)
  };
}

function canUseDevelopmentFallback() {
  return env.NODE_ENV === "development";
}
