import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env";
import { registerGoogleDriveRoutes } from "./integrations/googledrive/routes";
import { registerIntegrationRoutes } from "./modules/integrations/routes";
import { registerHealthRoutes } from "./routes/health";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  await app.register(cors, {
    origin: true
  });

  app.get("/", async () => ({
    application: "Marketplace API",
    status: "running"
  }));

  await app.register(registerHealthRoutes);
  await app.register(registerGoogleDriveRoutes);
  await app.register(registerIntegrationRoutes);

  return app;
}
