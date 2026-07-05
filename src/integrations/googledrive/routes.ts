import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  buildGoogleDriveAuthUrl,
  getGoogleDriveStatus,
  handleGoogleDriveCallback,
  testGoogleDriveConnection,
  testGoogleDriveServiceAccount
} from "./service";

const authStartQuerySchema = z.object({
  redirect: z.string().optional()
});

const authCallbackQuerySchema = z.object({
  code: z.string().min(1),
  scope: z.string().optional()
});

export async function registerGoogleDriveRoutes(app: FastifyInstance) {
  app.get("/integrations/googledrive/auth/start", async (request, reply) => {
    try {
      const query = authStartQuerySchema.parse(request.query ?? {});
      const authUrl = buildGoogleDriveAuthUrl();

      if (query.redirect === "false") {
        return {
          provider: "googledrive",
          authUrl
        };
      }

      return reply.redirect(authUrl);
    } catch (error) {
      return handleGoogleDriveRouteError(reply, error);
    }
  });

  app.get("/integrations/googledrive/auth/callback", async (request, reply) => {
    try {
      const query = authCallbackQuerySchema.parse(request.query ?? {});
      return {
        data: await handleGoogleDriveCallback(query.code)
      };
    } catch (error) {
      return handleGoogleDriveRouteError(reply, error);
    }
  });

  app.get("/integrations/googledrive/status", async (_request, reply) => {
    try {
      return await getGoogleDriveStatus();
    } catch (error) {
      return handleGoogleDriveRouteError(reply, error);
    }
  });

  app.post("/integrations/googledrive/test", async (_request, reply) => {
    try {
      return {
        data: await testGoogleDriveConnection()
      };
    } catch (error) {
      return handleGoogleDriveRouteError(reply, error);
    }
  });

  app.post("/integrations/googledrive/service-account/test", async (_request, reply) => {
    try {
      return {
        data: await testGoogleDriveServiceAccount()
      };
    } catch (error) {
      return handleGoogleDriveRouteError(reply, error);
    }
  });
}

function handleGoogleDriveRouteError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return reply.status(400).send({
    error: "googledrive_integration_error",
    message
  });
}
