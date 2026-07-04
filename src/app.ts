import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env";
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

  return app;
}
