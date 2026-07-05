import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { env } from "../../config/env";
import { createIntegrationLog } from "../../modules/integrations/repository";
import { prisma } from "../../services/prisma";

const PROVIDER = "googledrive" as const;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

type GoogleTokenCredentials = {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
};

type GoogleDriveFilesResponse = {
  files?: GoogleDriveFile[];
  error?: {
    message?: string;
  };
};

type GoogleServiceAccountCredentials = {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  token_uri?: string;
};

type GoogleServiceAccountTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export function buildGoogleDriveAuthUrl() {
  const config = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: DRIVE_READONLY_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true"
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function handleGoogleDriveCallback(code: string) {
  try {
    const config = getGoogleOAuthConfig();
    const tokenResponse = await exchangeCodeForTokens(code, config);
    const credentials = toStoredCredentials(tokenResponse);

    const row = await prisma.integrationConfig.upsert({
      where: {
        provider: PROVIDER
      },
      create: {
        provider: PROVIDER,
        displayName: "Google Drive",
        status: "connected",
        authType: "oauth",
        credentialsJson: toPrismaJson(credentials),
        settingsJson: toPrismaJson({}),
        lastConnectedAt: new Date()
      },
      update: {
        status: "connected",
        authType: "oauth",
        credentialsJson: toPrismaJson(credentials),
        lastConnectedAt: new Date()
      }
    });

    await logGoogleDrive("googledrive.oauth.callback", "success", "OAuth Google Drive concluido.", {
      credentialKeys: Object.keys(credentials),
      scope: credentials.scope
    });

    return {
      provider: row.provider,
      displayName: row.displayName,
      status: row.status,
      authType: row.authType,
      hasCredentials: Object.keys(credentials).length > 0,
      credentialKeys: Object.keys(credentials),
      lastConnectedAt: row.lastConnectedAt,
      lastSyncAt: row.lastSyncAt,
      updatedAt: row.updatedAt
    };
  } catch (error) {
    await logGoogleDrive("googledrive.oauth.callback", "error", "Erro controlado no OAuth Google Drive.", {
      error: errorMessage(error)
    });
    throw error;
  }
}

export async function getGoogleDriveStatus() {
  const row = await prisma.integrationConfig.findUnique({
    where: {
      provider: PROVIDER
    }
  });
  const credentials = parseCredentials(row?.credentialsJson);

  return {
    provider: PROVIDER,
    displayName: row?.displayName ?? "Google Drive",
    status: row?.status ?? "pending",
    authType: row?.authType ?? "oauth",
    hasCredentials: Object.keys(credentials).length > 0,
    credentialKeys: Object.keys(credentials),
    lastConnectedAt: row?.lastConnectedAt ?? null,
    lastSyncAt: row?.lastSyncAt ?? null,
    updatedAt: row?.updatedAt ?? null
  };
}

export async function testGoogleDriveConnection() {
  try {
    const credentials = await getValidCredentials();
    const files = await listRootFiles(credentials.access_token);

    await prisma.integrationConfig.update({
      where: {
        provider: PROVIDER
      },
      data: {
        status: "connected",
        lastSyncAt: new Date()
      }
    });

    await logGoogleDrive("googledrive.test", "success", "Teste Google Drive executado com sucesso.", {
      fileCount: files.length,
      query: "root"
    });

    return {
      provider: PROVIDER,
      status: "success",
      message: "Conexao Google Drive validada.",
      files
    };
  } catch (error) {
    await logGoogleDrive("googledrive.test", "error", "Erro controlado ao testar Google Drive.", {
      error: errorMessage(error)
    });
    throw error;
  }
}

export async function testGoogleDriveServiceAccount() {
  try {
    const serviceAccount = getGoogleServiceAccountCredentials();
    const accessToken = await getServiceAccountAccessToken(serviceAccount);
    const rootFolderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID || undefined;
    const files = await listServiceAccountFiles(accessToken, rootFolderId);
    const now = new Date();
    const settingsJson = rootFolderId ? { rootFolderId } : {};
    const safeCredentials = sanitizeServiceAccountCredentials(serviceAccount);
    const credentialKeys = Object.keys(safeCredentials);

    const [row] = await prisma.$queryRaw<Array<{
      provider: string;
      displayName: string;
      status: string;
      authType: string;
      settingsJson: unknown;
      lastConnectedAt: Date | null;
      lastSyncAt: Date | null;
      updatedAt: Date;
    }>>`
      INSERT INTO "integration_configs" (
        "provider",
        "displayName",
        "status",
        "authType",
        "credentialsJson",
        "settingsJson",
        "lastConnectedAt",
        "lastSyncAt",
        "updatedAt"
      )
      VALUES (
        ${PROVIDER}::"IntegrationProvider",
        ${"Google Drive"},
        ${"connected"}::"IntegrationStatus",
        ${"service_account"}::"IntegrationAuthType",
        ${toPrismaJson(safeCredentials)},
        ${toPrismaJson(settingsJson)},
        ${now},
        ${now},
        ${now}
      )
      ON CONFLICT ("provider") DO UPDATE SET
        "status" = ${"connected"}::"IntegrationStatus",
        "authType" = ${"service_account"}::"IntegrationAuthType",
        "credentialsJson" = ${toPrismaJson(safeCredentials)},
        "settingsJson" = ${toPrismaJson(settingsJson)},
        "lastConnectedAt" = ${now},
        "lastSyncAt" = ${now},
        "updatedAt" = ${now}
      RETURNING
        "provider",
        "displayName",
        "status",
        "authType",
        "settingsJson",
        "lastConnectedAt",
        "lastSyncAt",
        "updatedAt"
    `;

    await logGoogleDrive("googledrive.service_account.test", "success", "Service Account Google Drive validada.", {
      fileCount: files.length,
      rootFolderConfigured: Boolean(rootFolderId),
      serviceAccountEmail: serviceAccount.client_email
    });

    return {
      provider: PROVIDER,
      status: "success",
      message: "Service Account Google Drive validada.",
      authType: row?.authType ?? "service_account",
      hasCredentials: credentialKeys.length > 0,
      credentialKeys,
      settingsJson: row?.settingsJson ?? settingsJson,
      rootFolderId: rootFolderId ?? null,
      files
    };
  } catch (error) {
    await logGoogleDrive(
      "googledrive.service_account.test",
      "error",
      "Erro controlado ao testar Service Account Google Drive.",
      {
        error: errorMessage(error),
        rootFolderConfigured: Boolean(env.GOOGLE_DRIVE_ROOT_FOLDER_ID)
      }
    );
    throw error;
  }
}

async function exchangeCodeForTokens(
  code: string,
  config: ReturnType<typeof getGoogleOAuthConfig>
): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code"
    })
  });
  const payload = await response.json() as GoogleTokenResponse;

  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || "Falha ao trocar code por tokens Google.");
  }

  return payload;
}

async function refreshAccessToken(
  credentials: GoogleTokenCredentials
): Promise<GoogleTokenCredentials> {
  const config = getGoogleOAuthConfig();
  if (!credentials.refresh_token) {
    throw new Error("Google Drive sem refresh_token. Refaça o OAuth.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: credentials.refresh_token,
      grant_type: "refresh_token"
    })
  });
  const payload = await response.json() as GoogleTokenResponse;

  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || "Falha ao renovar token Google.");
  }

  const updatedCredentials = {
    ...credentials,
    ...toStoredCredentials(payload, credentials)
  };

  await prisma.integrationConfig.update({
    where: {
      provider: PROVIDER
    },
    data: {
      credentialsJson: toPrismaJson(updatedCredentials)
    }
  });

  return updatedCredentials;
}

async function getValidCredentials() {
  const row = await prisma.integrationConfig.findUnique({
    where: {
      provider: PROVIDER
    }
  });
  const credentials = parseCredentials(row?.credentialsJson);

  if (!credentials.access_token) {
    throw new Error("Google Drive ainda nao conectado. Inicie o OAuth.");
  }

  if (credentials.expiry_date && credentials.expiry_date <= Date.now() + 60_000) {
    return refreshAccessToken(credentials);
  }

  return credentials;
}

async function listRootFiles(accessToken: string | undefined) {
  if (!accessToken) {
    throw new Error("Google Drive sem access_token.");
  }

  const params = new URLSearchParams({
    pageSize: "5",
    fields: "files(id,name,mimeType,parents,modifiedTime)",
    spaces: "drive",
    q: "'root' in parents and trashed = false"
  });
  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}?${params.toString()}`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const payload = await response.json() as GoogleDriveFilesResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || "Falha ao listar arquivos do Google Drive.");
  }

  return (payload.files ?? []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    parents: file.parents,
    modifiedTime: file.modifiedTime
  }));
}

async function getServiceAccountAccessToken(
  serviceAccount: GoogleServiceAccountCredentials
) {
  const tokenUri = serviceAccount.token_uri || GOOGLE_TOKEN_URL;
  const assertion = createServiceAccountJwt(serviceAccount, tokenUri);
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const payload = await response.json() as GoogleServiceAccountTokenResponse;

  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(
      payload.error_description
        || payload.error
        || "Falha ao autenticar Service Account Google Drive."
    );
  }

  return payload.access_token;
}

async function listServiceAccountFiles(accessToken: string, rootFolderId?: string) {
  const params = new URLSearchParams({
    pageSize: "10",
    fields: "files(id,name,mimeType,parents,modifiedTime)",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    q: rootFolderId
      ? `'${rootFolderId.replace(/'/g, "\\'")}' in parents and trashed = false`
      : "trashed = false"
  });
  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}?${params.toString()}`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const payload = await response.json() as GoogleDriveFilesResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || "Falha ao listar arquivos com Service Account Google Drive.");
  }

  return (payload.files ?? []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    parents: file.parents,
    modifiedTime: file.modifiedTime
  }));
}

function getGoogleOAuthConfig() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new Error("Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI.");
  }

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI
  };
}

function getGoogleServiceAccountCredentials(): GoogleServiceAccountCredentials {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("Configure GOOGLE_SERVICE_ACCOUNT_JSON.");
  }

  const parsed = parseServiceAccountJson(env.GOOGLE_SERVICE_ACCOUNT_JSON);

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON precisa conter client_email e private_key.");
  }

  return {
    ...parsed,
    private_key: parsed.private_key.replace(/\\n/g, "\n")
  };
}

function parseServiceAccountJson(value: string): GoogleServiceAccountCredentials {
  try {
    return JSON.parse(value) as GoogleServiceAccountCredentials;
  } catch {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return JSON.parse(decoded) as GoogleServiceAccountCredentials;
  }
}

function createServiceAccountJwt(
  serviceAccount: GoogleServiceAccountCredentials,
  tokenUri: string
) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: serviceAccount.client_email,
    scope: DRIVE_READONLY_SCOPE,
    aud: tokenUri,
    iat: now,
    exp: now + 3600
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = crypto.createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(serviceAccount.private_key || "");

  return `${unsignedToken}.${base64Url(signature)}`;
}

function sanitizeServiceAccountCredentials(
  serviceAccount: GoogleServiceAccountCredentials
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(serviceAccount).filter(([key]) => key !== "private_key")
  );
}

function toStoredCredentials(
  tokenResponse: GoogleTokenResponse,
  previousCredentials: GoogleTokenCredentials = {}
): GoogleTokenCredentials {
  const expiresIn = tokenResponse.expires_in;

  return {
    access_token: tokenResponse.access_token ?? previousCredentials.access_token,
    refresh_token: tokenResponse.refresh_token ?? previousCredentials.refresh_token,
    expiry_date: expiresIn ? Date.now() + expiresIn * 1000 : previousCredentials.expiry_date,
    scope: tokenResponse.scope ?? previousCredentials.scope,
    token_type: tokenResponse.token_type ?? previousCredentials.token_type
  };
}

function parseCredentials(value: unknown): GoogleTokenCredentials {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as GoogleTokenCredentials;
}

async function logGoogleDrive(
  action: string,
  status: string,
  message: string,
  metadataJson: Record<string, unknown> = {}
) {
  try {
    await createIntegrationLog({
      provider: PROVIDER,
      action,
      status,
      message,
      metadataJson
    });
  } catch {
    // Logging must not prevent OAuth or test responses.
  }
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
