import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  HostedWhatsAppOnboardingMessage,
  HostedWhatsAppOnboardingModal,
} from "../components/HostedWhatsAppOnboardingModal";
import {
  NativeMetaSignupBridgeMessage,
  NativeMetaSignupModal,
} from "../components/NativeMetaSignupModal";
import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useCurrentSubscription } from "../hooks/useCurrentSubscription";
import { attachBusinessToCurrentSubscription } from "../services/razorpay";
import { updateBusinessReplyConfig } from "../services/api";
import {
  getWhatsAppUserSettings,
  setupWhatsAppBusinessAccount,
  type UserSettingsResponse,
} from "../services/whatsappConnection";
import { WhatsAppBusinessConnection } from "../types/autoReply";
import { palette, typography } from "../theme/palette";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: Record<string, unknown>,
      ) => void;
    };
    _shopKaBotSignup?: {
      waba_id?: string;
      phone_number_id?: string;
      phone_number?: string;
      display_name?: string;
    };
  }
}

type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  data?: {
    waba_id?: string;
    phone_number_id?: string;
    phone_number?: string;
    display_phone_number?: string;
    display_name?: string;
    [key: string]: unknown;
  };
};

type FacebookLoginResponse = {
  authResponse?: {
    code?: string;
  };
};

const META_APP_ID = process.env.EXPO_PUBLIC_META_APP_ID;
const META_CONFIG_ID = process.env.EXPO_PUBLIC_META_CONFIG_ID;
const META_SYNC_BASE_URL = process.env.EXPO_PUBLIC_SETTINGS_API_BASE_URL;
const HOSTED_WHATSAPP_ONBOARDING_URL =
  process.env.EXPO_PUBLIC_WHATSAPP_ONBOARDING_URL;
const FB_SDK_ID = "facebook-jssdk";
const GRAPH_API_VERSION = "v24.0";
const REPLY_FLOW_TYPE = "new_app";

function buildHostedOnboardingUrl(
  baseUrl: string,
  params: Record<string, string | null | undefined>,
) {
  const normalizedBaseUrl = baseUrl.trim();
  if (!normalizedBaseUrl) {
    return null;
  }

  const [basePath, existingQuery = ""] = normalizedBaseUrl.split("?");
  const searchParams = new URLSearchParams(existingQuery);

  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function safeParseMessage(data: unknown): EmbeddedSignupMessage | null {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as EmbeddedSignupMessage;
    } catch {
      return null;
    }
  }

  if (typeof data === "object" && data !== null) {
    return data as EmbeddedSignupMessage;
  }

  return null;
}

function waitForSignupIds(
  getIds: () => {
    waba_id?: string;
    phone_number_id?: string;
  },
  timeoutMs = 8000,
  intervalMs = 250,
): Promise<{ waba_id: string; phone_number_id: string }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const tick = () => {
      const { waba_id, phone_number_id } = getIds();
      if (waba_id && phone_number_id) {
        resolve({ waba_id, phone_number_id });
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            "Timed out waiting for waba_id and phone_number_id from Meta signup.",
          ),
        );
        return;
      }

      setTimeout(tick, intervalMs);
    };

    tick();
  });
}

function isMetaOrigin(origin: string) {
  return (
    origin === "https://www.facebook.com" ||
    origin === "https://web.facebook.com" ||
    origin === "https://business.facebook.com"
  );
}

export function ConnectWhatsAppScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { settings, updateSettings } = useAppSettings();
  const { hasActiveSubscription, loadingSubscription } = useCurrentSubscription();
  const [sdkLoaded, setSdkLoaded] = useState(Boolean(Platform.OS !== "web"));
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hostedSignupVisible, setHostedSignupVisible] = useState(false);
  const [nativeSignupVisible, setNativeSignupVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "connected" | "error">(
    settings.whatsappConnection ? "connected" : "idle",
  );
  const [lastEvent, setLastEvent] = useState<EmbeddedSignupMessage | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [backendBusinessSettings, setBackendBusinessSettings] = useState<
    UserSettingsResponse["businessSettings"] | null
  >(null);

  const signupRef = useRef<{
    waba_id?: string;
    phone_number_id?: string;
    phone_number?: string;
    display_name?: string;
    eventType?: string;
  }>({});
  const completionStartedRef = useRef(false);

  const connection = settings.whatsappConnection;
  const useHostedSignup = Platform.OS !== "web" && Boolean(HOSTED_WHATSAPP_ONBOARDING_URL);
  const hostedSignupUrl = useMemo(() => {
    if (!HOSTED_WHATSAPP_ONBOARDING_URL || !user?.uid) {
      return null;
    }

    return buildHostedOnboardingUrl(HOSTED_WHATSAPP_ONBOARDING_URL, {
      settingsId: user.uid,
      syncBaseUrl: META_SYNC_BASE_URL,
      source: "shopkabot-mobile-app",
      replyFlowType: REPLY_FLOW_TYPE,
    });
  }, [user?.uid]);

  const initializeFacebookSdk = useCallback(() => {
    if (Platform.OS !== "web") {
      return false;
    }

    if (!window.FB || !META_APP_ID) {
      return false;
    }

    window.FB.init({
      appId: META_APP_ID,
      autoLogAppEvents: true,
      cookie: true,
      xfbml: true,
      version: GRAPH_API_VERSION,
    });

    setSdkLoaded(true);
    setSdkError(null);
    return true;
  }, []);

  const metaConfigError = useMemo(() => {
    if (useHostedSignup) {
      return null;
    }

    if (!META_APP_ID) {
      return "Set EXPO_PUBLIC_META_APP_ID to load the Facebook SDK for embedded signup.";
    }

    if (!META_CONFIG_ID) {
      return "Set EXPO_PUBLIC_META_CONFIG_ID to open Meta embedded signup.";
    }

    return null;
  }, [useHostedSignup]);

  const persistConnection = useCallback(
    async (nextConnection: WhatsAppBusinessConnection) => {
      await updateSettings({
        ...settings,
        botActive: true,
        businessId: nextConnection.wabaId,
        whatsappConnection: nextConnection,
        businessName:
          nextConnection.displayName?.trim() || settings.businessName,
      });
    },
    [settings, updateSettings],
  );

  const refreshConnectionFromBackend = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!META_SYNC_BASE_URL || !user?.uid) {
        return false;
      }

      try {
        const authToken = user.getIdToken
          ? `Bearer ${await user.getIdToken()}`
          : undefined;
        const userSettings = await getWhatsAppUserSettings({
          baseUrl: META_SYNC_BASE_URL,
          settingsId: user.uid,
          authToken,
        });

        const businessSettings = userSettings.businessSettings;
        if (!businessSettings?.phoneNumberId || !businessSettings.businessId) {
          return false;
        }

        setBackendBusinessSettings(businessSettings);
        await persistConnection({
          wabaId: businessSettings.businessId,
          phoneNumberId: businessSettings.phoneNumberId,
          eventType:
            settings.whatsappConnection?.eventType || "FINISH",
          displayName:
            businessSettings.name || settings.businessName,
          phoneNumber: businessSettings.fullPhoneNumber,
          connectedAt:
            settings.whatsappConnection?.connectedAt ||
            new Date().toISOString(),
        });

        setStatus("connected");
        if (!options?.silent) {
          setSyncNote("Loaded the latest business settings from the backend.");
        }
        return true;
      } catch (error) {
        if (!options?.silent) {
          setSyncNote(
            error instanceof Error
              ? error.message
              : "Unable to refresh business settings from the backend.",
          );
        }
        return false;
      }
    },
    [
      persistConnection,
      settings.businessName,
      settings.whatsappConnection?.connectedAt,
      settings.whatsappConnection?.eventType,
      user,
    ],
  );

  useEffect(() => {
    if (connection) {
      setStatus("connected");
    }
  }, [connection]);

  useEffect(() => {
    if (backendBusinessSettings?.businessId && backendBusinessSettings.phoneNumberId) {
      setStatus("connected");
    }
  }, [backendBusinessSettings?.businessId, backendBusinessSettings?.phoneNumberId]);

  useFocusEffect(
    useCallback(() => {
      void refreshConnectionFromBackend({ silent: true });
    }, [refreshConnectionFromBackend]),
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    if (metaConfigError) {
      setSdkError(metaConfigError);
      return;
    }

    if (window.FB) {
      initializeFacebookSdk();
      return;
    }

    const existingScript = document.getElementById(FB_SDK_ID) as
      | HTMLScriptElement
      | null;
    const previousInit = window.fbAsyncInit;

    window.fbAsyncInit = () => {
      previousInit?.();
      if (!initializeFacebookSdk()) {
        setSdkError("Facebook SDK loaded but FB was unavailable.");
      }
    };

    const script = existingScript || document.createElement("script");
    if (!existingScript) {
      script.id = FB_SDK_ID;
      script.async = true;
      script.defer = true;
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(script);
    }

    const timeout = window.setTimeout(() => {
      if (!window.FB) {
        setSdkError("Facebook SDK not loaded. Please refresh and try again.");
      }
    }, 8000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [initializeFacebookSdk, metaConfigError]);

  const updateSignupSession = useCallback((message: EmbeddedSignupMessage) => {
    setLastEvent(message);

    const eventType = message.event || "";
    if (eventType) {
      signupRef.current.eventType = eventType;
    }

    const wabaId = message.data?.waba_id;
    const phoneNumberId = message.data?.phone_number_id;
    const phoneNumber =
      message.data?.display_phone_number || message.data?.phone_number;
    const displayName = message.data?.display_name;

    if (wabaId) {
      signupRef.current.waba_id = wabaId;
    }
    if (phoneNumberId) {
      signupRef.current.phone_number_id = phoneNumberId;
    }
    if (phoneNumber) {
      signupRef.current.phone_number = phoneNumber;
    }
    if (displayName) {
      signupRef.current.display_name = displayName;
    }

    if (Platform.OS === "web") {
      window._shopKaBotSignup = {
        waba_id: signupRef.current.waba_id,
        phone_number_id: signupRef.current.phone_number_id,
        phone_number: signupRef.current.phone_number,
        display_name: signupRef.current.display_name,
      };
    }
  }, []);

  const completeConnection = useCallback(
    async ({
      wabaId,
      phoneNumberId,
      eventType,
      displayName,
      phoneNumber,
      alreadySynced,
    }: {
      wabaId: string;
      phoneNumberId: string;
      eventType: string;
      displayName?: string;
      phoneNumber?: string;
      alreadySynced?: boolean;
    }) => {
      const nextConnection: WhatsAppBusinessConnection = {
        wabaId,
        phoneNumberId,
        eventType,
        displayName: displayName || settings.businessName,
        phoneNumber,
        connectedAt: new Date().toISOString(),
      };

      if (!alreadySynced && META_SYNC_BASE_URL && user?.uid) {
        try {
          const synced = await setupWhatsAppBusinessAccount({
            baseUrl: META_SYNC_BASE_URL,
            settingsId: user.uid,
            wabaId,
            phoneNumberId,
            eventType,
            replyFlowType: REPLY_FLOW_TYPE,
          });

          nextConnection.displayName =
            synced.businessSettings?.name || nextConnection.displayName;
          nextConnection.phoneNumber =
            synced.businessSettings?.fullPhoneNumber ||
            nextConnection.phoneNumber;
          if (synced.businessSettings) {
            setBackendBusinessSettings(synced.businessSettings);
          }

          setSyncNote("Business account synced with the backend.");
        } catch (error) {
          setSyncNote(
            error instanceof Error
              ? `${error.message} Saved locally for now.`
              : "Business account sync failed. Saved locally for now.",
          );
        }
      } else if (alreadySynced) {
        setSyncNote("Business account synced with the backend.");
      } else {
        setSyncNote(
          "Connected in ShopKaBot. Add EXPO_PUBLIC_SETTINGS_API_BASE_URL later if you also want backend sync.",
        );
      }

      if (user?.email) {
        try {
          await attachBusinessToCurrentSubscription(settings.apiBaseUrl, {
            gmailId: user.email,
            businessId: wabaId,
            businessName: nextConnection.displayName || settings.businessName,
          });
          setSyncNote(
            "WhatsApp Business connected. We linked this business to your subscription and backfilled existing auto-reply rules for this Gmail account.",
          );
        } catch (error) {
          setSyncNote(
            error instanceof Error
              ? `${error.message} WhatsApp was connected, but the subscription business link could not be updated yet.`
              : "WhatsApp was connected, but the subscription business link could not be updated yet.",
          );
        }
      }

      try {
        await updateBusinessReplyConfig({
          baseUrl: settings.apiBaseUrl,
          businessId: wabaId,
          payload: {
            autoReplyEnabled: true,
          },
        });
      } catch (error) {
        setSyncNote(
          error instanceof Error
            ? `${error.message} WhatsApp was connected, but auto-reply could not be enabled yet.`
            : "WhatsApp was connected, but auto-reply could not be enabled yet.",
        );
      }

      await persistConnection(nextConnection);
      setHostedSignupVisible(false);
      setNativeSignupVisible(false);
      setStatus("connected");

      if (alreadySynced) {
        void refreshConnectionFromBackend({ silent: true });
      }
    },
    [
      persistConnection,
      refreshConnectionFromBackend,
      settings.apiBaseUrl,
      settings.businessName,
      user?.email,
      user?.uid,
    ],
  );

  const finalizeEmbeddedSignup = useCallback(async () => {
    if (completionStartedRef.current) {
      return;
    }

    completionStartedRef.current = true;

    try {
      const { waba_id, phone_number_id } = await waitForSignupIds(
        () => ({
          waba_id:
            signupRef.current.waba_id ||
            (Platform.OS === "web" ? window._shopKaBotSignup?.waba_id : undefined),
          phone_number_id:
            signupRef.current.phone_number_id ||
            (Platform.OS === "web"
              ? window._shopKaBotSignup?.phone_number_id
              : undefined),
        }),
        8000,
      );
      await completeConnection({
        wabaId: waba_id,
        phoneNumberId: phone_number_id,
        eventType: signupRef.current.eventType || "FINISH",
        displayName: signupRef.current.display_name,
        phoneNumber: signupRef.current.phone_number,
      });
    } catch (error) {
      completionStartedRef.current = false;
      setHostedSignupVisible(false);
      setNativeSignupVisible(false);
      setStatus("error");
      Alert.alert(
        "Connection failed",
        error instanceof Error
          ? error.message
          : "Unable to finish WhatsApp Business signup.",
      );
    } finally {
      setConnecting(false);
    }
  }, [completeConnection]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const handler = (event: MessageEvent) => {
      if (!isMetaOrigin(event.origin)) {
        return;
      }

      const message = safeParseMessage(event.data);
      if (!message || message.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      updateSignupSession(message);

      const eventType = message.event || "";
      if (
        eventType.startsWith("CANCEL") ||
        eventType.startsWith("ERROR") ||
        eventType.includes("FAIL")
      ) {
        setStatus("error");
        setConnecting(false);
        return;
      }

      if (
        eventType.startsWith("FINISH") &&
        message.data?.waba_id &&
        message.data?.phone_number_id
      ) {
        void finalizeEmbeddedSignup();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [finalizeEmbeddedSignup, updateSignupSession]);

  const postFbLogin = useCallback(
    (response: FacebookLoginResponse) => {
      if (!response.authResponse?.code) {
        setConnecting(false);
        setStatus("error");
        return;
      }

      void finalizeEmbeddedSignup();
    },
    [finalizeEmbeddedSignup],
  );

  const handleNativeBridgeMessage = useCallback(
    (message: NativeMetaSignupBridgeMessage) => {
      if (message.type === "sdk_loaded") {
        setSdkError(null);
        return;
      }

      if (message.type === "sdk_error" || message.type === "signup_error") {
        completionStartedRef.current = false;
        setNativeSignupVisible(false);
        setConnecting(false);
        setStatus("error");
        setSdkError(message.message);
        return;
      }

      if (message.type === "signup_event") {
        updateSignupSession(message.payload as EmbeddedSignupMessage);

        const eventType = message.payload.event || "";
        if (
          eventType.startsWith("CANCEL") ||
          eventType.startsWith("ERROR") ||
          eventType.includes("FAIL")
        ) {
          completionStartedRef.current = false;
          setNativeSignupVisible(false);
          setConnecting(false);
          setStatus("error");
          return;
        }

        if (
          eventType.startsWith("FINISH") &&
          message.payload.data?.waba_id &&
          message.payload.data?.phone_number_id
        ) {
          void finalizeEmbeddedSignup();
        }

        return;
      }

      if (message.type === "login_callback") {
        if (!message.hasAuthResponse) {
          completionStartedRef.current = false;
          setNativeSignupVisible(false);
          setConnecting(false);
          setStatus("error");
          return;
        }

        void finalizeEmbeddedSignup();
      }
    },
    [finalizeEmbeddedSignup, updateSignupSession],
  );

  const handleHostedBridgeMessage = useCallback(
    async (message: HostedWhatsAppOnboardingMessage) => {
      if (message.type === "signup_ready") {
        setSdkError(null);
        return;
      }

      if (message.type === "signup_cancelled" || message.type === "signup_error") {
        completionStartedRef.current = false;
        setHostedSignupVisible(false);
        setConnecting(false);
        setStatus("error");
        setSdkError(message.message);
        if (message.type === "signup_error") {
          Alert.alert("Connection failed", message.message);
        }
        return;
      }

      if (message.type !== "signup_success") {
        return;
      }

      try {
        setSdkError(null);
        await completeConnection({
          wabaId: message.payload.wabaId,
          phoneNumberId: message.payload.phoneNumberId,
          eventType: message.payload.eventType || "FINISH",
          displayName:
            message.payload.businessSettings?.name || message.payload.displayName,
          phoneNumber:
            message.payload.businessSettings?.fullPhoneNumber ||
            message.payload.phoneNumber,
          alreadySynced: message.payload.synced,
        });
      } catch (error) {
        completionStartedRef.current = false;
        setHostedSignupVisible(false);
        setConnecting(false);
        setStatus("error");
        Alert.alert(
          "Connection failed",
          error instanceof Error
            ? error.message
            : "Unable to finish WhatsApp Business signup.",
        );
      } finally {
        setConnecting(false);
      }
    },
    [completeConnection],
  );

  const launchSignup = useCallback(() => {
    if (metaConfigError) {
      setSdkError(metaConfigError);
      return;
    }

    signupRef.current = {};
    completionStartedRef.current = false;
    if (Platform.OS === "web") {
      window._shopKaBotSignup = {};
    }
    setConnecting(true);
    setStatus("idle");
    setSdkError(null);
    setSyncNote(null);

    if (Platform.OS !== "web") {
      if (useHostedSignup && hostedSignupUrl) {
        setHostedSignupVisible(true);
        return;
      }

      setNativeSignupVisible(true);
      return;
    }

    if (!window.FB) {
      setSdkError("Facebook SDK not loaded yet. Please refresh and try again.");
      setConnecting(false);
      return;
    }

    if (!initializeFacebookSdk()) {
      setSdkError("Facebook SDK is present but not initialized correctly.");
      setConnecting(false);
      return;
    }

    window.FB.login(postFbLogin, {
      config_id: META_CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: "whatsapp_business_app_onboarding",
        sessionInfoVersion: "3",
        version: "v4",
      },
    });
  }, [
    hostedSignupUrl,
    initializeFacebookSdk,
    metaConfigError,
    postFbLogin,
    useHostedSignup,
  ]);

  const closeNativeSignup = useCallback(() => {
    completionStartedRef.current = false;
    setNativeSignupVisible(false);
    setConnecting(false);
  }, []);

  const closeHostedSignup = useCallback(() => {
    completionStartedRef.current = false;
    setHostedSignupVisible(false);
    setConnecting(false);
  }, []);

  const resolvedBusinessName =
    backendBusinessSettings?.name?.trim() ||
    connection?.displayName ||
    settings.businessName;
  const resolvedPhoneNumber =
    backendBusinessSettings?.fullPhoneNumber?.trim() ||
    connection?.phoneNumber ||
    null;
  const resolvedWabaId =
    backendBusinessSettings?.businessId?.trim() ||
    connection?.wabaId ||
    settings.businessId ||
    null;
  const resolvedPhoneNumberId =
    backendBusinessSettings?.phoneNumberId?.trim() ||
    connection?.phoneNumberId ||
    null;

  if (loadingSubscription) {
    return (
      <PageScaffold
        title="Connect WhatsApp"
        subtitle="Checking your plan."
      >
        <SectionCard title="Loading">
          <View style={styles.lockedState}>
            <ActivityIndicator color={palette.primaryGreen} />
            <Text style={styles.lockedCopy}>
              Loading your current plan status...
            </Text>
          </View>
        </SectionCard>
      </PageScaffold>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <PageScaffold
        title="Connect WhatsApp"
        subtitle="Connect WhatsApp after plan activation."
      >
        <SectionCard title="Subscription Required">
          <View style={styles.lockedState}>
            <View style={styles.lockedIconWrap}>
              <Ionicons name="lock-closed-outline" size={24} color={palette.warning} />
            </View>
            <Text style={styles.lockedTitle}>Plan activation needed</Text>
            <Text style={styles.lockedCopy}>
              Activate a plan first, then connect WhatsApp Business.
            </Text>
            <Pressable
              style={styles.lockedButton}
              onPress={() => navigation.navigate("Subscription")}
            >
              <Text style={styles.lockedButtonText}>Go To Subscription</Text>
            </Pressable>
          </View>
        </SectionCard>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title="Connect WhatsApp"
      subtitle="Link your WhatsApp Business account."
    >
      <SectionCard title="Connect Account">
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View
              style={[
                styles.iconWrap,
                status === "connected" && styles.iconWrapConnected,
              ]}
            >
              <Ionicons
                name="logo-whatsapp"
                size={28}
                color={
                  status === "connected"
                    ? palette.success
                    : palette.primaryGreen
                }
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>WhatsApp Business Automation</Text>
              <Text style={styles.heroText}>
                Connect your account and start using ShopKaBot on that number.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              status === "connected"
                ? styles.statusBadgeConnected
                : styles.statusBadgeIdle,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    status === "connected"
                      ? palette.success
                      : palette.warning,
                },
              ]}
            />
            <Text style={styles.statusBadgeText}>
              {status === "connected" ? "Business Account Connected" : "Awaiting Connection"}
            </Text>
          </View>
        </View>

        {resolvedWabaId || resolvedPhoneNumberId ? (
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Business Name</Text>
              <Text style={styles.detailValue}>
                {resolvedBusinessName}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>
                {resolvedPhoneNumber || "Available after backend sync"}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>WABA ID</Text>
              <Text style={styles.detailValueMono}>
                {resolvedWabaId || "Available after backend sync"}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Phone Number ID</Text>
              <Text style={styles.detailValueMono}>
                {resolvedPhoneNumberId || "Available after backend sync"}
              </Text>
            </View>
          </View>
        ) : null}

        {!resolvedWabaId && !resolvedPhoneNumberId ? (
          <View style={styles.stepsCard}>
            {[
              "Sign in with Facebook.",
              "Choose your WhatsApp Business account.",
              "Pick the number you want to connect.",
              "Finish the setup flow.",
            ].map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {Platform.OS !== "web" ? (
          <View style={styles.noticeCard}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={palette.accentTeal}
            />
            <Text style={styles.noticeText}>
              {useHostedSignup
                ? "Android opens the hosted onboarding page inside the app and brings the connected business back automatically."
                : "Android uses the same embedded signup flow as the working React app."}
            </Text>
          </View>
        ) : null}

        {!sdkLoaded && !sdkError && Platform.OS === "web" ? (
          <View style={styles.noticeCard}>
            <ActivityIndicator color={palette.primaryGreen} />
            <Text style={styles.noticeText}>Loading Facebook SDK...</Text>
          </View>
        ) : null}

        {sdkError ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={palette.danger}
            />
            <Text style={styles.errorText}>{sdkError}</Text>
          </View>
        ) : null}

        {syncNote ? (
          <View style={styles.syncCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={palette.accentTeal}
            />
            <Text style={styles.syncText}>{syncNote}</Text>
          </View>
        ) : null}

        {status === "error" && !sdkError ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="warning-outline"
              size={18}
              color={palette.warning}
            />
            <Text style={styles.errorText}>
              The last connection attempt did not finish. Try again.
            </Text>
          </View>
        ) : null}

        {status !== "connected" ? (
          <Pressable
            onPress={launchSignup}
            disabled={
              Platform.OS === "web"
                ? !sdkLoaded || Boolean(sdkError) || connecting
                : connecting
            }
            style={({ pressed }) => [
              styles.connectButton,
              pressed && styles.connectButtonPressed,
              ((Platform.OS === "web" && (!sdkLoaded || Boolean(sdkError))) ||
                connecting) &&
                styles.connectButtonDisabled,
            ]}
          >
            <Ionicons
              name={connecting ? "hourglass-outline" : "logo-facebook"}
              size={18}
              color={palette.textWhite}
            />
            <Text style={styles.connectButtonText}>
              {connecting
                ? useHostedSignup
                  ? "Opening onboarding..."
                  : "Opening Facebook..."
                : "Connect WhatsApp Business"}
            </Text>
          </Pressable>
        ) : null}

        {process.env.NODE_ENV === "development" && lastEvent ? (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Debug Session Info</Text>
            <Text style={styles.debugText}>
              {JSON.stringify(lastEvent, null, 2)}
            </Text>
          </View>
        ) : null}
      </SectionCard>

      {Platform.OS !== "web" && useHostedSignup && hostedSignupUrl ? (
        <HostedWhatsAppOnboardingModal
          visible={hostedSignupVisible}
          onboardingUrl={hostedSignupUrl}
          onClose={closeHostedSignup}
          onBridgeMessage={handleHostedBridgeMessage}
        />
      ) : null}

      {Platform.OS !== "web" && !useHostedSignup && META_APP_ID && META_CONFIG_ID ? (
        <NativeMetaSignupModal
          visible={nativeSignupVisible}
          appId={META_APP_ID}
          configId={META_CONFIG_ID}
          onClose={closeNativeSignup}
          onBridgeMessage={handleNativeBridgeMessage}
        />
      ) : null}
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  lockedState: {
    minHeight: 220,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  lockedIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  lockedTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 20,
    textAlign: "center",
  },
  lockedCopy: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  lockedButton: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  lockedButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  heroCard: {
    gap: 16,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(37,211,102,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.16)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,211,102,0.12)",
  },
  iconWrapConnected: {
    backgroundColor: "rgba(34,197,94,0.14)",
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 22,
  },
  heroText: {
    color: "rgba(255,255,255,0.74)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusBadgeConnected: {
    backgroundColor: "rgba(34,197,94,0.16)",
  },
  statusBadgeIdle: {
    backgroundColor: "rgba(245,158,11,0.14)",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  detailsGrid: {
    gap: 12,
  },
  detailCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 5,
  },
  detailLabel: {
    color: "rgba(255,255,255,0.54)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  detailValue: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  detailValueMono: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  stepsCard: {
    gap: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },
  noticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorText: {
    flex: 1,
    color: "rgba(255,255,255,0.86)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(0,194,168,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,194,168,0.18)",
  },
  syncText: {
    flex: 1,
    color: "rgba(255,255,255,0.86)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  connectButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  connectButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 16,
  },
  debugCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 8,
  },
  debugTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  debugText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
});
