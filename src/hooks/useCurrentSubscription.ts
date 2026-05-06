import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  getCurrentRazorpaySubscription,
  RazorpaySubscriptionRecord,
} from "../services/razorpay";

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "authenticated",
  "completed",
]);

export function useCurrentSubscription() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const [currentSubscription, setCurrentSubscription] =
    useState<RazorpaySubscriptionRecord | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );

  const loadCurrentSubscription = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user?.email) {
        setCurrentSubscription(null);
        setLoadingSubscription(false);
        return null;
      }

      if (!options?.silent) {
        setLoadingSubscription(true);
      }

      setSubscriptionError(null);

      try {
        const result = await getCurrentRazorpaySubscription({
          baseUrl: settings.apiBaseUrl,
          gmailId: user.email,
        });
        setCurrentSubscription(result);
        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load current subscription.";

        if (message === "No subscription record found.") {
          setCurrentSubscription(null);
          return null;
        }

        setSubscriptionError(message);
        return null;
      } finally {
        if (!options?.silent) {
          setLoadingSubscription(false);
        }
      }
    },
    [settings.apiBaseUrl, user?.email],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCurrentSubscription();
    }, [loadCurrentSubscription]),
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleFocus = () => {
        void loadCurrentSubscription({ silent: true });
      };

      window.addEventListener("focus", handleFocus);
      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    }

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          void loadCurrentSubscription({ silent: true });
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [loadCurrentSubscription]);

  return {
    currentSubscription,
    setCurrentSubscription,
    loadingSubscription,
    subscriptionError,
    loadCurrentSubscription,
    hasActiveSubscription: Boolean(
      currentSubscription &&
        ACTIVE_SUBSCRIPTION_STATUSES.has(currentSubscription.status),
    ),
  };
}

