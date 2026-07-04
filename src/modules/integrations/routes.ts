import type { FastifyInstance, FastifyReply } from "fastify";
import {
  rawProviderParamSchema,
  updateIntegrationSchema
} from "./schemas";
import {
  getIntegration,
  IntegrationStorageUnavailableError,
  isIntegrationProvider,
  listIntegrations,
  testIntegration,
  updateIntegration
} from "./service";

export async function registerIntegrationRoutes(app: FastifyInstance) {
  app.get("/integrations", async (_request, reply) => {
    try {
      return await listIntegrations();
    } catch (error) {
      return handleIntegrationRouteError(reply, error);
    }
  });

  app.get("/integrations/:provider", async (request, reply) => {
    const params = rawProviderParamSchema.parse(request.params);
    if (!isIntegrationProvider(params.provider)) {
      return reply.status(404).send({
        error: "integration_provider_not_found",
        message: `Provider nao configuravel: ${params.provider}`
      });
    }

    try {
      return await getIntegration(params.provider);
    } catch (error) {
      return handleIntegrationRouteError(reply, error);
    }
  });

  app.post("/integrations/:provider/test", async (request, reply) => {
    const params = rawProviderParamSchema.parse(request.params);
    if (!isIntegrationProvider(params.provider)) {
      return reply.status(404).send({
        error: "integration_provider_not_found",
        message: `Provider nao configuravel: ${params.provider}`
      });
    }

    try {
      return {
        data: await testIntegration(params.provider)
      };
    } catch (error) {
      return handleIntegrationRouteError(reply, error);
    }
  });

  app.patch("/integrations/:provider", async (request, reply) => {
    const params = rawProviderParamSchema.parse(request.params);
    if (!isIntegrationProvider(params.provider)) {
      return reply.status(404).send({
        error: "integration_provider_not_found",
        message: `Provider nao configuravel: ${params.provider}`
      });
    }

    const body = updateIntegrationSchema.parse(request.body ?? {});
    try {
      return {
        data: await updateIntegration(params.provider, body)
      };
    } catch (error) {
      return handleIntegrationRouteError(reply, error);
    }
  });
}

function handleIntegrationRouteError(reply: FastifyReply, error: unknown) {
  if (error instanceof IntegrationStorageUnavailableError) {
    return reply.status(error.statusCode).send({
      error: "integration_storage_unavailable",
      message: error.message
    });
  }

  throw error;
}
