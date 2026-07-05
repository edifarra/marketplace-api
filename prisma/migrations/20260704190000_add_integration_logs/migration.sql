CREATE TABLE "integration_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" "IntegrationProvider" NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integration_logs_provider_createdAt_idx"
  ON "integration_logs"("provider", "createdAt");

CREATE INDEX "integration_logs_createdAt_idx"
  ON "integration_logs"("createdAt");
