import { z } from "zod";
import { integrationAuthTypes, integrationProviders, integrationStatuses } from "./types";

export const providerParamSchema = z.object({
  provider: z.enum(integrationProviders)
});

export const rawProviderParamSchema = z.object({
  provider: z.string().min(1)
});

export const updateIntegrationSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  status: z.enum(integrationStatuses).optional(),
  authType: z.enum(integrationAuthTypes).optional(),
  credentialsJson: z.record(z.unknown()).optional(),
  settingsJson: z.record(z.unknown()).optional()
});

export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
