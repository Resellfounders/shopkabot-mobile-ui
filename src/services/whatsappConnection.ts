type SetupBusinessAccountParams = {
  baseUrl: string;
  settingsId: string;
  wabaId: string;
  phoneNumberId: string;
  eventType: string;
  replyFlowType?: string;
};

export type SetupBusinessAccountResponse = {
  uuid?: string;
  businessSettings?: {
    name?: string;
    fullPhoneNumber?: string;
    phoneNumberId?: string;
    businessId?: string;
    replyFlowType?: string;
  };
};

export type UserSettingsResponse = {
  uuid?: string;
  businessSettings?: {
    name?: string;
    fullPhoneNumber?: string;
    phoneNumberId?: string;
    businessId?: string;
    replyFlowType?: string;
  };
};

export type UserSettingsSubscriptionSnapshotPayload = {
  provider?: string;
  providerSubscriptionId?: string;
  providerPaymentId?: string | null;
  status?: string;
  planId?: string;
  planName?: string;
  totalCount?: number;
  gmailId?: string;
  businessId?: string | null;
  businessName?: string | null;
  currentStart?: number | null;
  currentEnd?: number | null;
  verifiedAt?: string | null;
  updatedAt?: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

export async function setupWhatsAppBusinessAccount({
  baseUrl,
  settingsId,
  wabaId,
  phoneNumberId,
  eventType,
  replyFlowType,
}: SetupBusinessAccountParams): Promise<SetupBusinessAccountResponse> {
  const searchParams = new URLSearchParams({
    settingsId,
    whatsAppEventType: eventType,
    wabaId,
    phoneNumberId,
  });
  if (replyFlowType?.trim()) {
    searchParams.set("replyFlowType", replyFlowType.trim());
  }

  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/settings/user/setup/business-account?${searchParams.toString()}`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Business account sync failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<SetupBusinessAccountResponse>;
}

export async function getWhatsAppUserSettings({
  baseUrl,
  settingsId,
  authToken,
}: {
  baseUrl: string;
  settingsId: string;
  authToken?: string | null;
}): Promise<UserSettingsResponse> {
  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/settings/user/${encodeURIComponent(settingsId)}`,
    {
      headers: authToken
        ? {
            Authorization: authToken,
          }
        : undefined,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load business settings. Status ${response.status}.`,
    );
  }

  return response.json() as Promise<UserSettingsResponse>;
}

export async function saveUserSettingsSubscriptionSnapshot({
  baseUrl,
  settingsId,
  payload,
}: {
  baseUrl: string;
  settingsId: string;
  payload: UserSettingsSubscriptionSnapshotPayload;
}): Promise<UserSettingsResponse> {
  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/settings/user/subscription/snapshot?settingsId=${encodeURIComponent(
      settingsId,
    )}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Subscription snapshot sync failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<UserSettingsResponse>;
}
