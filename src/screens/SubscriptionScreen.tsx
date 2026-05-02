import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  useCurrentSubscription,
} from "../hooks/useCurrentSubscription";
import {
  createRazorpaySubscription,
  getRazorpayConfig,
  openFallbackCheckoutLink,
  openRazorpaySubscriptionCheckout,
  verifyRazorpaySubscription,
} from "../services/razorpay";
import { palette, typography } from "../theme/palette";

type PlanCard = {
  name: string;
  price: string;
  total: string;
  badge: string;
  description: string;
  highlight: boolean;
  bullets: string[];
  buttonLabel: string;
  planId?: string;
  totalCount?: number;
  contactUrl?: string;
};

const POLL_ATTEMPTS = 12;
const POLL_DELAY_MS = 5000;
const FRONTEND_APP_SUPPORT_WHATSAPP_LINK =
  "https://wa.me/919768260471?text=" +
  encodeURIComponent(
    "Hi, I need help with my ShopKaBot subscription and WhatsApp onboarding.",
  );

const plans: PlanCard[] = [
  {
    name: "Monthly",
    price: "Rs. 999/month",
    total: "Rs. 999",
    badge: "Good For Trying",
    description: "Best for getting started.",
    highlight: false,
    bullets: [
      "1 month billing",
      "Total: Rs. 999",
      "Great for a first setup",
    ],
    planId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_MONTHLY_ID,
    totalCount: 1,
    buttonLabel: "Start Monthly Plan",
  },
  {
    name: "6 Months",
    price: "Rs. 899/month",
    total: "Rs. 5,394",
    badge: "Better Value",
    description: "Saves Rs. 600 compared to monthly billing.",
    highlight: true,
    bullets: [
      "6 month billing",
      "Total: Rs. 5,394",
      "Better value for growing teams",
    ],
    planId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_6_MONTHS_ID,
    totalCount: 1,
    buttonLabel: "Start 6 Month Plan",
  },
  {
    name: "12 Months",
    price: "Rs. 799/month",
    total: "Rs. 9,588",
    badge: "Best Value",
    description: "Saves Rs. 2,400 compared to monthly billing.",
    highlight: false,
    bullets: [
      "12 month billing",
      "Total: Rs. 9,588",
      "Lowest long-term price",
    ],
    planId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_12_MONTHS_ID,
    totalCount: 1,
    buttonLabel: "Start 12 Month Plan",
  },
  {
    name: "Enterprise / Agentic AI",
    price: "Custom Pricing",
    total: "Built for advanced automation",
    badge: "Premium",
    description: "For advanced workflows and custom integrations.",
    highlight: false,
    bullets: [
      "Custom onboarding and strategy support",
      "Advanced agentic AI flows and business logic",
      "CRM, Shopify, API, and internal tool integrations",
    ],
    contactUrl:
      process.env.EXPO_PUBLIC_CONTACT_BOOKING_URL ||
      process.env.EXPO_PUBLIC_CONTACT_WHATSAPP_URL ||
      "",
    buttonLabel: "Talk To Sales",
  },
];

export function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [pollingSubscription, setPollingSubscription] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(
    null,
  );
  const {
    currentSubscription,
    setCurrentSubscription,
    loadingSubscription,
    subscriptionError,
    loadCurrentSubscription,
    hasActiveSubscription,
  } = useCurrentSubscription();
  const frontendRazorpayKeyId =
    process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";
  const checkoutFallbackLink =
    process.env.EXPO_PUBLIC_RAZORPAY_CHECKOUT_LINK || "";
  const needsBusinessOnboarding =
    hasActiveSubscription &&
    (!settings.businessId.trim() || !settings.whatsappConnection);

  const pollForSubscriptionSync = useCallback(
    async (subscriptionId?: string) => {
      if (!user?.email) {
        return;
      }

      setPollingSubscription(true);
      setSubscriptionMessage(
        "Waiting for Razorpay to confirm your payment in the app...",
      );

      try {
        for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
          const record = await loadCurrentSubscription({ silent: true });
          const isMatchingSubscription =
            !subscriptionId ||
            record?.providerSubscriptionId === subscriptionId;
          const isActivated =
            !!record && ACTIVE_SUBSCRIPTION_STATUSES.has(record.status);

          if (record && isMatchingSubscription && isActivated) {
            setSubscriptionMessage(
              `${record.planName} is now active in the app.`,
            );
            return record;
          }

          if (attempt < POLL_ATTEMPTS - 1) {
            await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
          }
        }

        setSubscriptionMessage(
          "Payment was started successfully. If the status has not updated yet, tap Refresh Status after the webhook arrives.",
        );
        return null;
      } finally {
        setPollingSubscription(false);
      }
    },
    [loadCurrentSubscription, user?.email],
  );

  const handlePlanPress = async (plan: PlanCard) => {
    if (plan.contactUrl) {
      await Linking.openURL(plan.contactUrl);
      return;
    }

    if (plan.name === "Enterprise / Agentic AI") {
      Alert.alert(
        "Contact sales",
        "Add EXPO_PUBLIC_CONTACT_BOOKING_URL or EXPO_PUBLIC_CONTACT_WHATSAPP_URL to enable the Enterprise sales flow.",
      );
      return;
    }

    if (!plan.planId) {
      Alert.alert("Plan missing", "This Razorpay plan is not configured yet.");
      return;
    }

    if (!user?.email) {
      Alert.alert(
        "Missing account email",
        "Sign in again before starting a subscription checkout.",
      );
      return;
    }

    setActivePlan(plan.name);
    setSubscriptionMessage(null);
    let createdSubscriptionId: string | undefined;

    try {
      const subscription = await createRazorpaySubscription(
        settings.apiBaseUrl,
        {
          planId: plan.planId,
          planName: plan.name,
          totalCount: plan.totalCount || 1,
          gmailId: user.email,
          businessId: null,
          customerName: user?.displayName || undefined,
          customerEmail: user?.email || undefined,
          businessName: settings.businessName,
        },
      );
      createdSubscriptionId = subscription.subscriptionId;

      setCurrentSubscription((current) => ({
        ...(current || {
          id: subscription.subscriptionId,
          provider: "razorpay",
          providerPaymentId: null,
          businessName: settings.businessName,
          customerName: user?.displayName || null,
          customerEmail: user?.email || null,
          customerContact: null,
          latestWebhookEvent: null,
          latestWebhookEventId: null,
          latestWebhookReceivedAt: null,
          verifiedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        providerSubscriptionId: subscription.subscriptionId,
        status: subscription.status,
        planId: subscription.planId,
        planName: plan.name,
        totalCount: subscription.totalCount,
        gmailId: user.email,
        businessId: null,
        chargeAt: subscription.chargeAt ?? null,
        updatedAt: new Date().toISOString(),
      }));

      const keyId =
        frontendRazorpayKeyId ||
        (await getRazorpayConfig(settings.apiBaseUrl)).keyId;

      if (subscription.shortUrl) {
        await openFallbackCheckoutLink(subscription.shortUrl);
        void pollForSubscriptionSync(subscription.subscriptionId);
        Alert.alert(
          "Subscription link opened",
          `${plan.name} subscription link opened. Complete the Razorpay authorisation payment and then return to the app. The screen will keep checking for a confirmed status.`,
        );
        return;
      }

      if (Platform.OS !== "web") {
        await openFallbackCheckoutLink(checkoutFallbackLink);
        void pollForSubscriptionSync(subscription.subscriptionId);
        Alert.alert(
          "Subscription created",
          `Subscription ${subscription.subscriptionId} was created. Complete checkout in the browser fallback for now, then return to the app to see the updated plan status.`,
        );
        return;
      }

      const checkoutResponse = await openRazorpaySubscriptionCheckout({
        keyId,
        subscriptionId: subscription.subscriptionId,
        planName: plan.name,
        description: `${plan.name} - ShopKaBot WhatsApp Business Automation`,
        customerName: user?.displayName || undefined,
        customerEmail: user?.email || undefined,
        onDismiss: () => undefined,
      });

      await verifyRazorpaySubscription(settings.apiBaseUrl, {
        razorpayPaymentId: checkoutResponse.razorpay_payment_id,
        razorpaySubscriptionId: checkoutResponse.razorpay_subscription_id,
        razorpaySignature: checkoutResponse.razorpay_signature,
      });
      await loadCurrentSubscription({ silent: true });

      Alert.alert(
        "Payment successful",
        `${plan.name} was activated successfully for ${settings.businessName}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Razorpay checkout.";

      if (checkoutFallbackLink) {
        Alert.alert(
          "Checkout issue",
          `${message}\n\nOpening the fallback Razorpay payment link instead.`,
        );
        await openFallbackCheckoutLink(checkoutFallbackLink);
        void pollForSubscriptionSync(
          createdSubscriptionId || currentSubscription?.providerSubscriptionId,
        );
      } else {
        Alert.alert("Checkout issue", message);
      }
    } finally {
      setActivePlan(null);
    }
  };

  const subscriptionPlans = plans.filter((plan) => !plan.contactUrl);

  return (
    <PageScaffold
      title="Subscription"
      subtitle="Choose a plan and activate your workspace."
    >
      <SectionCard title="Current Plan">
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              getStatusBadgeStyle(currentSubscription?.status),
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {currentSubscription
                ? formatStatusLabel(currentSubscription.status)
                : "No plan yet"}
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() => void loadCurrentSubscription()}
            disabled={loadingSubscription || pollingSubscription}
          >
            <Text style={styles.refreshButtonText}>
              {loadingSubscription || pollingSubscription
                ? "Refreshing..."
                : "Refresh Status"}
            </Text>
          </Pressable>
        </View>

        {loadingSubscription ? (
          <View style={styles.subscriptionStateBox}>
            <ActivityIndicator color={palette.primaryGreen} />
            <Text style={styles.subscriptionMetaText}>
              Loading your current plan status...
            </Text>
          </View>
        ) : currentSubscription ? (
          <View style={styles.subscriptionStateBox}>
            <Text style={styles.subscriptionPlanName}>
              Active plan: {currentSubscription.planName}
            </Text>
            <Text style={styles.subscriptionMetaText}>
              Subscription ID: {currentSubscription.providerSubscriptionId}
            </Text>
            <Text style={styles.subscriptionMetaText}>
              Last updated: {formatTimestamp(currentSubscription.updatedAt)}
            </Text>
            <Text style={styles.subscriptionMetaText}>
              Subscription ends on:{" "}
              {formatSubscriptionEnd(
                currentSubscription.currentEnd,
                currentSubscription.endAt,
                currentSubscription.chargeAt,
              )}
            </Text>
            {currentSubscription.latestWebhookEvent ? (
              <Text style={styles.subscriptionMetaText}>
                Latest webhook: {currentSubscription.latestWebhookEvent}
              </Text>
            ) : null}
            {currentSubscription.providerPaymentId ? (
              <Text style={styles.subscriptionMetaText}>
                Payment ID: {currentSubscription.providerPaymentId}
              </Text>
            ) : null}
            {hasActiveSubscription && needsBusinessOnboarding ? (
              <View style={styles.statusActionRow}>
                <Pressable
                  style={styles.onboardButton}
                  onPress={() => navigation.navigate("Connect WhatsApp")}
                >
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={18}
                    color={palette.textDark}
                  />
                  <Text style={styles.onboardButtonText}>
                    Connect WhatsApp
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.subscriptionStateBoxMuted}>
            <Text style={styles.subscriptionPlanName}>No subscription yet</Text>
            <Text style={styles.subscriptionMetaText}>
              Start a plan below and this screen will begin tracking its backend
              status.
            </Text>
          </View>
        )}

        {subscriptionMessage ? (
          <View style={styles.subscriptionMessageBox}>
            <Text style={styles.subscriptionMessageText}>
              {subscriptionMessage}
            </Text>
          </View>
        ) : null}

        {subscriptionError ? (
          <Text style={styles.subscriptionErrorText}>{subscriptionError}</Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Plans">
        <View style={styles.checkoutNote}>
          <Ionicons
            name="card-outline"
            size={18}
            color={palette.accentTeal}
          />
          <Text style={styles.checkoutNoteText}>
            {hasActiveSubscription
              ? "Your active plan is highlighted below."
              : "Choose the plan for this account."}
          </Text>
        </View>

        <View style={styles.planGrid}>
          {subscriptionPlans.map((plan) => {
            const isActivePlan =
              hasActiveSubscription &&
              currentSubscription?.planId === plan.planId;

            return (
              <LinearGradient
                key={plan.name}
                colors={
                  isActivePlan
                    ? ["rgba(34,197,94,0.28)", "rgba(0,194,168,0.16)"]
                    : plan.highlight
                      ? ["rgba(37,211,102,0.24)", "rgba(0,194,168,0.18)"]
                      : ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]
                }
                style={[
                  styles.planCard,
                  isActivePlan && styles.planCardActive,
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      plan.highlight && styles.badgeHighlight,
                      isActivePlan && styles.badgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        plan.highlight && styles.badgeTextHighlight,
                        isActivePlan && styles.badgeTextActive,
                      ]}
                    >
                      {isActivePlan ? "ACTIVE PLAN" : plan.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planTotal}>Total: {plan.total}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>

                {plan.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.planBullet}>
                    • {bullet}
                  </Text>
                ))}

                <Pressable
                  style={[
                    styles.planButton,
                    activePlan === plan.name && styles.planButtonDisabled,
                    isActivePlan && styles.planButtonActive,
                  ]}
                  onPress={() => void handlePlanPress(plan)}
                  disabled={activePlan === plan.name || isActivePlan}
                >
                  <Text
                    style={[
                      styles.planButtonText,
                      isActivePlan && styles.planButtonTextActive,
                    ]}
                  >
                    {isActivePlan
                      ? "Plan Active"
                      : activePlan === plan.name
                        ? "Opening Checkout..."
                        : plan.buttonLabel}
                  </Text>
                </Pressable>
              </LinearGradient>
            );
          })}
        </View>
      </SectionCard>
    </PageScaffold>
  );
}

function formatStatusLabel(status?: string | null) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusBadgeStyle(status?: string | null) {
  if (!status) {
    return {
      backgroundColor: "rgba(255,255,255,0.08)",
      borderColor: "rgba(255,255,255,0.14)",
    };
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return {
      backgroundColor: "rgba(34,197,94,0.16)",
      borderColor: "rgba(34,197,94,0.28)",
    };
  }

  if (status === "created" || status === "pending") {
    return {
      backgroundColor: "rgba(245,158,11,0.16)",
      borderColor: "rgba(245,158,11,0.28)",
    };
  }

  return {
    backgroundColor: "rgba(239,68,68,0.14)",
    borderColor: "rgba(239,68,68,0.24)",
  };
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Not available yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatSubscriptionEnd(
  currentEnd?: number | null,
  endAt?: number | null,
  chargeAt?: number | null,
) {
  const timestamp = currentEnd || endAt || chargeAt;
  if (!timestamp) {
    return "Not available yet";
  }

  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) {
    return "Not available yet";
  }

  return date.toLocaleString();
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  refreshButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  subscriptionStateBox: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    backgroundColor: "rgba(37,211,102,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.14)",
  },
  subscriptionStateBoxMuted: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  subscriptionPlanName: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 18,
  },
  subscriptionMetaText: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  subscriptionMessageBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(0,194,168,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,194,168,0.2)",
  },
  subscriptionMessageText: {
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  statusActionRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  onboardButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: palette.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  onboardButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  subscriptionErrorText: {
    color: palette.warning,
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  checkoutNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,194,168,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,194,168,0.18)",
  },
  checkoutNoteText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  planGrid: {
    gap: 14,
  },
  planCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 10,
  },
  planCardActive: {
    borderColor: "rgba(34,197,94,0.4)",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  planName: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeHighlight: {
    backgroundColor: "rgba(37,211,102,0.18)",
  },
  badgeActive: {
    backgroundColor: "rgba(34,197,94,0.24)",
  },
  badgeText: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  badgeTextHighlight: {
    color: palette.primaryGreen,
  },
  badgeTextActive: {
    color: palette.textWhite,
  },
  planPrice: {
    color: palette.primaryGreen,
    fontFamily: typography.extrabold,
    fontSize: 28,
  },
  planTotal: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  planDescription: {
    color: "rgba(255,255,255,0.74)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  planBullet: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  planButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: palette.textWhite,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  planButtonDisabled: {
    opacity: 0.72,
  },
  planButtonActive: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
  },
  planButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  planButtonTextActive: {
    color: palette.textWhite,
  },
});





