export const integrationProviders = [
  "shopee",
  "mercadolivre",
  "tiny",
  "googledrive",
  "cloudinary",
  "supabase"
] as const;

export const integrationStatuses = ["disabled", "pending", "connected", "error"] as const;

export const integrationAuthTypes = ["oauth", "api_key", "internal", "manual"] as const;

export type IntegrationProvider = (typeof integrationProviders)[number];
export type IntegrationStatus = (typeof integrationStatuses)[number];
export type IntegrationAuthType = (typeof integrationAuthTypes)[number];

export type IntegrationConfigView = {
  id: string | null;
  provider: IntegrationProvider;
  displayName: string;
  status: IntegrationStatus;
  authType: IntegrationAuthType;
  settingsJson: unknown;
  hasCredentials: boolean;
  credentialKeys: string[];
  lastConnectedAt: Date | null;
  lastSyncAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type IntegrationStatusView = Pick<
  IntegrationConfigView,
  | "provider"
  | "displayName"
  | "status"
  | "authType"
  | "hasCredentials"
  | "credentialKeys"
  | "lastConnectedAt"
  | "lastSyncAt"
  | "updatedAt"
>;

export type IntegrationLogView = {
  id: string;
  provider: IntegrationProvider;
  action: string;
  status: string;
  message: string;
  metadataJson: unknown;
  createdAt: Date;
};

export const defaultIntegrationConfigs: Record<
  IntegrationProvider,
  {
    displayName: string;
    status: IntegrationStatus;
    authType: IntegrationAuthType;
    settingsJson: Record<string, unknown>;
  }
> = {
  shopee: {
    displayName: "Shopee",
    status: "pending",
    authType: "oauth",
    settingsJson: {}
  },
  mercadolivre: {
    displayName: "Mercado Livre",
    status: "pending",
    authType: "oauth",
    settingsJson: {}
  },
  tiny: {
    displayName: "Tiny ERP",
    status: "pending",
    authType: "api_key",
    settingsJson: {}
  },
  googledrive: {
    displayName: "Google Drive",
    status: "pending",
    authType: "oauth",
    settingsJson: {}
  },
  cloudinary: {
    displayName: "Cloudinary",
    status: "pending",
    authType: "api_key",
    settingsJson: {}
  },
  supabase: {
    displayName: "Supabase",
    status: "pending",
    authType: "internal",
    settingsJson: {}
  }
};
