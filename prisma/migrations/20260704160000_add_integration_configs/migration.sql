CREATE TYPE "IntegrationProvider" AS ENUM (
  'shopee',
  'mercadolivre',
  'tiny',
  'googledrive',
  'cloudinary',
  'supabase'
);

CREATE TYPE "IntegrationStatus" AS ENUM (
  'disabled',
  'pending',
  'connected',
  'error'
);

CREATE TYPE "IntegrationAuthType" AS ENUM (
  'oauth',
  'api_key',
  'internal',
  'manual'
);

CREATE TABLE "integration_configs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" "IntegrationProvider" NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" "IntegrationStatus" NOT NULL DEFAULT 'pending',
  "authType" "IntegrationAuthType" NOT NULL,
  "credentialsJson" JSONB,
  "settingsJson" JSONB,
  "lastConnectedAt" TIMESTAMP(3),
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_configs_provider_key" ON "integration_configs"("provider");
CREATE INDEX "integration_configs_status_idx" ON "integration_configs"("status");
