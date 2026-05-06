import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getWhatsAppUserSettings } from "../services/whatsappConnection";

const USER_SETTINGS_BASE_URL =
  process.env.EXPO_PUBLIC_SETTINGS_API_BASE_URL || "";

type ResolvedBusinessSettings = {
  name?: string;
  fullPhoneNumber?: string;
  phoneNumberId?: string;
  businessId?: string;
  replyFlowType?: string;
};

function normalize(value: string | null | undefined) {
  return value?.trim() || "";
}

export function useUserSettingsBusiness() {
  const { user } = useAuth();
  const [businessSettings, setBusinessSettings] =
    useState<ResolvedBusinessSettings | null>(null);
  const [loadingBusinessSettings, setLoadingBusinessSettings] = useState(true);
  const [businessSettingsError, setBusinessSettingsError] = useState<
    string | null
  >(null);

  const refreshBusinessSettings = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!USER_SETTINGS_BASE_URL || !user?.uid) {
        setBusinessSettings(null);
        setBusinessSettingsError(null);
        setLoadingBusinessSettings(false);
        return null;
      }

      if (!options?.silent) {
        setLoadingBusinessSettings(true);
      }
      setBusinessSettingsError(null);

      try {
        const userSettings = await getWhatsAppUserSettings({
          baseUrl: USER_SETTINGS_BASE_URL,
          settingsId: user.uid,
        });

        const resolved = userSettings.businessSettings || null;
        const hasConnectedBusiness = Boolean(
          normalize(resolved?.businessId) && normalize(resolved?.phoneNumberId),
        );
        setBusinessSettings(hasConnectedBusiness ? resolved : null);
        return hasConnectedBusiness ? resolved : null;
      } catch (error) {
        setBusinessSettings(null);
        setBusinessSettingsError(
          error instanceof Error
            ? error.message
            : "Unable to load WhatsApp business settings.",
        );
        return null;
      } finally {
        if (!options?.silent) {
          setLoadingBusinessSettings(false);
        }
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshBusinessSettings();
    }, [refreshBusinessSettings]),
  );

  const resolvedBusinessId = useMemo(
    () => normalize(businessSettings?.businessId) || null,
    [businessSettings?.businessId],
  );

  return {
    businessSettings,
    resolvedBusinessId,
    loadingBusinessSettings,
    businessSettingsError,
    refreshBusinessSettings,
    hasConnectedBusiness: Boolean(resolvedBusinessId),
  };
}
