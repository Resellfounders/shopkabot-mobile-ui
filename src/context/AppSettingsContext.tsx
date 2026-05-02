import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { StoredAppSettings } from "../types/autoReply";

const STORAGE_KEY = "shopkabot_mobile_settings";

const defaultSettings: StoredAppSettings = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:8000",
  businessId: "",
  businessName: "ShopKaBot Business",
  botActive: false,
  whatsappConnection: null,
};

function sanitizeSettings(nextSettings: StoredAppSettings): StoredAppSettings {
  const hasWhatsAppConnection = !!nextSettings.whatsappConnection?.phoneNumberId;

  return {
    ...nextSettings,
    botActive: hasWhatsAppConnection ? nextSettings.botActive : false,
  };
}

type AppSettingsContextValue = {
  settings: StoredAppSettings;
  isLoaded: boolean;
  updateSettings: (nextSettings: StoredAppSettings) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(
  undefined,
);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }

        const parsed = JSON.parse(value) as Partial<StoredAppSettings>;
        setSettings((current) =>
          sanitizeSettings({
            ...current,
            ...parsed,
          }),
        );
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      isLoaded,
      updateSettings: async (nextSettings: StoredAppSettings) => {
        const sanitized = sanitizeSettings(nextSettings);
        setSettings(sanitized);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      },
    }),
    [isLoaded, settings],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }

  return context;
}

