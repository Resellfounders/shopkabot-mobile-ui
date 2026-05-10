import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  enterpriseSubscriptionPlan,
  FRONTEND_APP_SUPPORT_WHATSAPP_LINK,
  paidSubscriptionPlans,
  SubscriptionPlan,
} from "../content/subscriptions";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { signInWithGooglePopup, signOutUser } from "../services/firebase";
import {
  initializeWebTracking,
  trackBeginCheckout,
  trackContact,
  trackCustomerWon,
  trackCustomEvent,
  trackPageView,
} from "../services/marketingTracking";
import {
  createRazorpaySubscription,
  getCurrentRazorpaySubscription,
  getRazorpayConfig,
  openFallbackCheckoutLink,
  openRazorpaySubscriptionCheckout,
  RazorpaySubscriptionRecord,
  verifyRazorpaySubscription,
} from "../services/razorpay";
import { palette, typography } from "../theme/palette";
import { navigateToPublicWebRoute } from "../utils/webEntry";

const POLL_ATTEMPTS = 12;
const POLL_DELAY_MS = 5000;
const CHECKOUT_BUTTON_GREEN = "#17643D";

const brandLogo = require("../../assets/icon.png");
const demoPlaceholderImage = require("../../assets/Shop-ka-bot.png");
const heroWideImage = demoPlaceholderImage;
const loginImage = demoPlaceholderImage;
const customerMessageImage = demoPlaceholderImage;
const creatorTiles = [
  {
    name: "@shopkabot.store",
    count: "156K",
    tag: "Local Business",
    image: heroWideImage,
  },
  {
    name: "@shopkabot.fashion",
    count: "728K",
    tag: "Retail",
    image: customerMessageImage,
  },
  {
    name: "@shopkabot.tech",
    count: "3.3M",
    tag: "Tech",
    image: loginImage,
  },
  {
    name: "@shopkabot.fitness",
    count: "35K",
    tag: "Fitness",
    image: heroWideImage,
  },
  {
    name: "@shopkabot.home",
    count: "1.2M",
    tag: "Home Brand",
    image: customerMessageImage,
  },
];

const featureTiles = [
  {
    title: "WhatsApp keyword replies",
    description:
      "Reply to price, delivery, stock, and product questions from one trained workspace.",
  },
  {
    title: "Auto follow-ups",
    description:
      "Nudge buyers who asked questions but did not complete their order or booking.",
  },
  {
    title: "Google account based setup",
    description:
      "Attach the subscription to the exact account that will use ShopKaBot later.",
  },
  {
    title: "AI guided order flow",
    description:
      "Move chats from enquiry to interest to purchase with faster replies and cleaner handoff.",
  },
  {
    title: "Re-trigger old leads",
    description:
      "Bring back previous enquiries by keeping a consistent reply and follow-up workflow.",
  },
  {
    title: "Simple team onboarding",
    description:
      "Start with a plan, connect WhatsApp Business, and continue inside the main web app.",
  },
  {
    title: "Support for Indian businesses",
    description:
      "Built for stores, service brands, boutique owners, and WhatsApp-first selling teams.",
  },
  {
    title: "Checkout to workspace",
    description:
      "The same account that pays can immediately continue into ShopKaBot after activation.",
  },
];

const testimonials = [
  {
    name: "Riya, boutique founder",
    handle: "@shopkabot.boutique",
    text: "ShopKaBot makes our WhatsApp replies feel organized. Buyers get fast answers and our team jumps in only when needed.",
  },
  {
    name: "Amit, electronics seller",
    handle: "@shopkabot.electronics",
    text: "The public flow is very clean. People come from the ad, choose a plan, sign in with Google, pay, and then continue to setup.",
  },
  {
    name: "Pooja, home business owner",
    handle: "@shopkabot.home",
    text: "The plan activation feels much more trustworthy when the account and payment are connected before they enter the app.",
  },
  {
    name: "Manav, agency operator",
    handle: "@shopkabot.agency",
    text: "This is the exact kind of flow we needed for paid traffic. Fewer steps, less confusion, and better account mapping.",
  },
];

function getPlanTrackingValue(
  plan?: Pick<SubscriptionPlan, "name" | "total"> | null,
) {
  if (!plan) {
    return undefined;
  }

  const numericValue = Number((plan.total || "").replace(/[^\d.]/g, ""));
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  if (plan.name === "12 Months") {
    return 9588;
  }

  if (plan.name === "6 Months") {
    return 5394;
  }

  if (plan.name === "Monthly") {
    return 999;
  }

  return undefined;
}

const faqItems = [
  {
    question: "Is the plan linked to the Google account?",
    answer:
      "Yes. The user selects a Google account first, and that same account becomes the owner of the ShopKaBot subscription.",
  },
  {
    question: "What happens after payment?",
    answer:
      "After Razorpay confirms the subscription, the user can open ShopKaBot, log in, and continue onboarding in the same workspace.",
  },
  {
    question: "Can I switch the Google account before checkout?",
    answer:
      "Yes. The get-started page includes a switch-account action before the payment is started.",
  },
  {
    question: "Do I still need to connect WhatsApp Business?",
    answer:
      "Yes. Plan activation unlocks the workspace, and then the user connects WhatsApp Business inside the main app.",
  },
];

type MessageTone = "info" | "success" | "error";

export function PublicSalesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "ShopKaBot | Sales";
    }
  }, []);

  const creatorRail = useMemo(
    () => [...creatorTiles, ...creatorTiles, ...creatorTiles],
    [],
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      <View style={styles.discountBar}>
        <View style={styles.maxShell}>
          <View
            style={[
              styles.discountBarInner,
              isDesktop && styles.discountBarInnerDesktop,
            ]}
          >
            <View
              style={[
                styles.discountCopyBlock,
                isDesktop && styles.discountCopyBlockDesktop,
              ]}
            >
              <View style={styles.discountCopyRow}>
                <Text style={styles.discountEmoji}>🥳</Text>
                <Text style={styles.discountCopy}>Special 50% Discount for Lifetime</Text>
              </View>
            </View>
            <View
              style={[
                styles.discountCountdownBlock,
                isDesktop && styles.discountCountdownBlockDesktop,
              ]}
            >
              <View style={styles.discountCountdownRow}>
                <CountdownChunk label="Hours" value="00" />
                <Text style={styles.discountColon}>:</Text>
                <CountdownChunk label="Minutes" value="40" />
                <Text style={styles.discountColon}>:</Text>
                <CountdownChunk label="Seconds" value="54" />
              </View>
            </View>
            <View
              style={[
                styles.discountButtonBlock,
                isDesktop && styles.discountButtonBlockDesktop,
              ]}
            >
              <Pressable
                onPress={() => navigateToPublicWebRoute("get-started")}
                style={({ pressed }) => [
                  styles.discountButton,
                  isDesktop && styles.discountButtonDesktop,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.discountButtonText}>Get Instant Access</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.salesPage}>
        <View style={styles.heroSection}>
          <View style={styles.maxShell}>
            <View style={styles.logoLockup}>
              <View style={styles.logoRow}>
                <Image source={brandLogo} style={styles.salesLogo} />
                <Text style={styles.logoX}>x</Text>
                <View style={styles.metaPlaceholder}>
                  <Ionicons name="logo-whatsapp" size={30} color="#1b1aff" />
                </View>
              </View>
            </View>

            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>
                #1 WhatsApp Automation Platform For Selling Teams
              </Text>
            </View>

            <Text style={styles.heroHeadline}>
              Convert more enquiries and close more buyers on WhatsApp
            </Text>

            <Text style={styles.heroSubheadline}>
              Guide ad traffic into a clean ShopKaBot flow where people choose
              a plan, connect the right Google account, and activate their
              workspace faster.
            </Text>

            <Pressable
              onPress={() => navigateToPublicWebRoute("get-started")}
              style={({ pressed }) => [
                styles.primarySalesButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primarySalesButtonText}>Get Instant Access</Text>
            </Pressable>

            <TrustPills />

            <View style={styles.heroVisualBlock}>
              <PlaceholderShowcase
                source={heroWideImage}
                label="ShopKaBot demo"
                title="AI replies, plan activation, and web app continuation"
                subtitle="Placeholder preview image"
                large
              />
            </View>
          </View>
        </View>

        <View style={styles.creatorStripSection}>
          <View style={styles.maxShellWide}>
            <Text style={styles.creatorStripTitle}>
              Trusted by fast-moving businesses
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorStripRow}
            >
              {creatorRail.map((item, index) => (
                <CreatorTileCard
                  key={`${item.name}-${index}`}
                  name={item.name}
                  count={item.count}
                  tag={item.tag}
                  source={item.image}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.lightGreySection}>
          <View style={styles.maxShell}>
            <Text style={styles.sectionKickerBlue}>How it works</Text>
            <Text style={styles.sectionTitleCenter}>
              The simple flow that turns paid clicks into active ShopKaBot users
            </Text>
            <View
              style={[styles.formulaGrid, isDesktop && styles.formulaGridDesktop]}
            >
              <FormulaCard
                title="More Qualified Leads"
                description="Respond instantly to common WhatsApp questions and keep serious buyers engaged."
                source={loginImage}
              />
              <FormulaCard
                title="More Conversions"
                description="Attach the right Google account before checkout so activation and login stay connected."
                source={customerMessageImage}
              />
              <FormulaCard
                title="Smoother Onboarding"
                description="After payment, the same account can move into the main app and finish WhatsApp setup."
                source={heroWideImage}
                dark
              />
            </View>
          </View>
        </View>

        <View style={styles.whiteSection}>
          <View style={[styles.maxShell, isDesktop && styles.twoColumnFeatureRow]}>
            <PlaceholderShowcase
              source={customerMessageImage}
              label="Feature preview"
              title="Ask for the right account before activation"
              subtitle="Placeholder image"
            />
            <View style={styles.sideCopyBlock}>
              <Text style={styles.sideFeatureTitle}>
                Get cleaner buyer-to-workspace mapping
              </Text>
              <Text style={styles.sideFeatureDescription}>
                Do not just collect payments. Make sure the subscription is
                tied to the Google account that will actually use ShopKaBot
                after checkout.
              </Text>
              <Pressable
                onPress={() => navigateToPublicWebRoute("get-started")}
                style={({ pressed }) => [
                  styles.secondaryBlueButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryBlueButtonText}>Get Instant Access</Text>
              </Pressable>
              <TrustPills darkText />
            </View>
          </View>
        </View>

        <View style={styles.darkFeatureSection}>
          <View style={styles.maxShell}>
            <Text style={styles.darkKicker}>All the features you need</Text>
            <Text style={styles.darkSectionTitle}>
              Unlock the full power of ShopKaBot
            </Text>
            <View style={styles.featureTileGrid}>
              {featureTiles.map((item) => (
                <View key={item.title} style={styles.featureTile}>
                  <View style={styles.featureTileIcon}>
                    <Ionicons name="checkmark" size={16} color="#1b1aff" />
                  </View>
                  <View style={styles.featureTileCopy}>
                    <Text style={styles.featureTileTitle}>{item.title}</Text>
                    <Text style={styles.featureTileDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.centerActionWrap}>
              <Pressable
                onPress={() => navigateToPublicWebRoute("get-started")}
                style={({ pressed }) => [
                  styles.primarySalesButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primarySalesButtonText}>Get Instant Access</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <AlternatingFeatureSection
          title="Convert More Buyers!"
          description="Ensure your plan, account ownership, and app usage stay tied to the same person so setup feels seamless after payment."
          source={loginImage}
        />

        <AlternatingFeatureSection
          title="Boost Engagement!"
          description="Train ShopKaBot to answer the same questions your team gets every day and keep buyers moving instead of waiting."
          source={heroWideImage}
          reverse
        />

        <View style={styles.whiteSection}>
          <View style={styles.maxShell}>
            <Text style={styles.sectionTitleCenter}>
              See What People Are Saying
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.testimonialRow}
            >
              {testimonials.map((item) => (
                <TestimonialCard
                  key={item.name}
                  name={item.name}
                  handle={item.handle}
                  text={item.text}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.lightCtaStripSection}>
          <View style={styles.maxShell}>
            <View style={styles.centerActionWrap}>
              <Pressable
                onPress={() => navigateToPublicWebRoute("get-started")}
                style={({ pressed }) => [
                  styles.primarySalesButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primarySalesButtonText}>Get Instant Access</Text>
              </Pressable>
            </View>
            <TrustPills darkText />
          </View>
        </View>

        <View style={styles.whiteSection}>
          <View style={[styles.maxShell, isDesktop && styles.faqSplit]}>
            <View style={styles.faqHeaderBlock}>
              <Text style={styles.sectionKickerBlue}>FAQs</Text>
              <Text style={styles.faqHeadline}>
                All Questions <Text style={styles.blueWord}>Answered</Text>
              </Text>
            </View>
            <View style={styles.faqList}>
              {faqItems.map((faq) => (
                <View key={faq.question} style={styles.faqItem}>
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons name="chevron-down" size={18} color="#1b1aff" />
                  </View>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.maxShell}>
            <View style={styles.footerCtaBlock}>
              <Text style={styles.sectionKickerBlue}>Footer CTA</Text>
              <Text style={styles.footerCtaTitle}>
                Start Replying Faster With ShopKaBot
              </Text>
              <Text style={styles.footerCtaText}>
                Train your AI chatbot with your business data and let it handle
                WhatsApp customer enquiries automatically.
              </Text>
              <Pressable
                onPress={() => navigateToPublicWebRoute("get-started")}
                style={({ pressed }) => [
                  styles.secondaryBlueButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryBlueButtonText}>Start at Rs. 999/month</Text>
              </Pressable>
            </View>
            <View style={styles.footerInner}>
              <View style={styles.footerBrand}>
                <Image source={brandLogo} style={styles.footerLogo} />
                <View>
                  <Text style={styles.footerBrandText}>ShopKaBot</Text>
                  <Text style={styles.footerTagline}>
                    WhatsApp AI Chatbot for Small Businesses.
                  </Text>
                </View>
              </View>
              <View style={styles.footerLinks}>
                <Text style={styles.footerLink}>Terms & Conditions</Text>
                <Text style={styles.footerLink}>Privacy Policy</Text>
                <Text style={styles.footerLink}>Refund Policy</Text>
                <Text style={styles.footerLink}>Contact Us</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export function PublicGetStartedScreen() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);
  const [activePlanName, setActivePlanName] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<RazorpaySubscriptionRecord | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [pollingSubscription, setPollingSubscription] = useState(false);
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Select a plan below. We will ask for the Google account first if needed, then continue into Razorpay checkout.",
  );
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );
  const trackedPurchasesRef = useRef<Set<string>>(new Set());

  const frontendRazorpayKeyId =
    process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";
  const checkoutFallbackLink =
    process.env.EXPO_PUBLIC_RAZORPAY_CHECKOUT_LINK || "";
  const hasActiveSubscription = Boolean(
    currentSubscription &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(currentSubscription.status),
  );
  const routeToAppHome = useCallback(() => {
    navigateToPublicWebRoute("app", { replace: true });
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "ShopKaBot | Choose Your Plan";
    }

    initializeWebTracking();
    trackPageView({
      pagePath: "/get-started",
      pageTitle: "ShopKaBot | Choose Your Plan",
    });
    trackBeginCheckout({
      content_name: "ShopKaBot Subscription Plans",
      content_type: "subscription_collection",
      currency: "INR",
      value: 999,
    });
  }, []);

  useEffect(() => {
    if (!user?.email || !hasActiveSubscription || pollingSubscription) {
      return;
    }

    routeToAppHome();
  }, [hasActiveSubscription, pollingSubscription, routeToAppHome, user?.email]);

  const trackActivatedPurchase = useCallback(
    (
      record: RazorpaySubscriptionRecord,
      plan?: Pick<SubscriptionPlan, "name" | "total">,
    ) => {
      const trackingKey = record.providerSubscriptionId || record.id;
      if (!trackingKey || trackedPurchasesRef.current.has(trackingKey)) {
        return;
      }

      trackedPurchasesRef.current.add(trackingKey);
      trackCustomerWon({
        transaction_id: record.providerPaymentId || trackingKey,
        subscription_id: trackingKey,
        content_name: record.planName,
        content_type: "subscription_plan",
        currency: "INR",
        value: getPlanTrackingValue({
          name: plan?.name || record.planName,
          total: plan?.total || "",
        }),
      });
    },
    [],
  );

  const loadCurrentSubscription = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user?.email) {
        setCurrentSubscription(null);
        setSubscriptionError(null);
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
            : "Unable to load the current subscription.";

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

  useEffect(() => {
    void loadCurrentSubscription();
  }, [loadCurrentSubscription]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.email) {
      return;
    }

    const handleFocus = () => {
      void loadCurrentSubscription({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadCurrentSubscription, user?.email]);

  const pollForSubscriptionSync = useCallback(
    async (
      subscriptionId: string,
      planName: string,
      plan?: Pick<SubscriptionPlan, "name" | "total">,
    ) => {
      if (!user?.email) {
        return null;
      }

      setPollingSubscription(true);
      setMessageTone("info");
      setStatusMessage(
        "Waiting for Razorpay to confirm the payment and sync the plan to this Google account...",
      );

      try {
        for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
          const record = await getCurrentRazorpaySubscription({
            baseUrl: settings.apiBaseUrl,
            gmailId: user.email,
          }).catch((error: unknown) => {
            if (
              error instanceof Error &&
              error.message === "No subscription record found."
            ) {
              return null;
            }

            throw error;
          });

          const isMatchingSubscription =
            !record || record.providerSubscriptionId === subscriptionId;
          const isActive =
            !!record && ACTIVE_SUBSCRIPTION_STATUSES.has(record.status);

          if (record && isMatchingSubscription && isActive) {
            trackActivatedPurchase(record, plan);
            setCurrentSubscription(record);
            setMessageTone("success");
            setStatusMessage(
              `${planName} is active for ${user.email}. Opening the ShopKaBot workspace now...`,
            );
            routeToAppHome();
            return record;
          }

          if (attempt < POLL_ATTEMPTS - 1) {
            await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
          }
        }

        setMessageTone("info");
        setStatusMessage(
          "Payment was started. If the plan is not active yet, open the app and refresh the subscription screen after the webhook sync arrives.",
        );
        return null;
      } finally {
        setPollingSubscription(false);
      }
    },
    [routeToAppHome, settings.apiBaseUrl, trackActivatedPurchase, user?.email],
  );

  const startPlanCheckout = useCallback(
    async (plan: SubscriptionPlan) => {
      if (plan.contactUrl) {
        trackContact({
          content_name: plan.name,
          content_type: "enterprise_sales",
        });
        await Linking.openURL(plan.contactUrl);
        return;
      }

      if (plan.name === "Enterprise / Agentic AI") {
        setMessageTone("info");
        setStatusMessage(
          "Enterprise uses a direct sales conversation instead of the self-serve flow.",
        );
        return;
      }

      if (!plan.planId) {
        setMessageTone("error");
        setStatusMessage("This plan is not configured yet.");
        return;
      }

      if (!user?.email) {
        setPendingPlan(plan);
        setMessageTone("info");
        setStatusMessage(
          `Continue with Google first so the ${plan.name} plan is linked to the right ShopKaBot account.`,
        );
        trackCustomEvent("checkout_google_signin_required", {
          plan_name: plan.name,
          page_path: "/get-started",
        });

        try {
          await signInWithGooglePopup();
        } catch (error) {
          setPendingPlan(null);
          setMessageTone("error");
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Unable to sign in with Google.",
          );
        }
        return;
      }

      setActivePlanName(plan.name);
      setMessageTone("info");
      setStatusMessage(`Preparing ${plan.name} checkout for ${user.email}...`);
      trackBeginCheckout({
        content_name: plan.name,
        content_type: "subscription_plan",
        currency: "INR",
        value: getPlanTrackingValue(plan),
        num_items: 1,
      });
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
            customerName: user.displayName || undefined,
            customerEmail: user.email || undefined,
            businessName: settings.businessName,
          },
        );
        createdSubscriptionId = subscription.subscriptionId;

        const keyId =
          frontendRazorpayKeyId ||
          (await getRazorpayConfig(settings.apiBaseUrl)).keyId;

        if (subscription.shortUrl) {
          await openFallbackCheckoutLink(subscription.shortUrl);
          setMessageTone("info");
          setStatusMessage(
            `Razorpay checkout opened for ${plan.name}. Complete payment and return here while we keep checking for activation.`,
          );
          void pollForSubscriptionSync(subscription.subscriptionId, plan.name, plan);
          return;
        }

        const checkoutResponse = await openRazorpaySubscriptionCheckout({
          keyId,
          subscriptionId: subscription.subscriptionId,
          planName: plan.name,
          description: `${plan.name} - ShopKaBot WhatsApp Business Automation`,
          customerName: user.displayName || undefined,
          customerEmail: user.email || undefined,
          onDismiss: () => undefined,
        });

        await verifyRazorpaySubscription(settings.apiBaseUrl, {
          razorpayPaymentId: checkoutResponse.razorpay_payment_id,
          razorpaySubscriptionId: checkoutResponse.razorpay_subscription_id,
          razorpaySignature: checkoutResponse.razorpay_signature,
        });
        trackCustomerWon({
          transaction_id: checkoutResponse.razorpay_payment_id,
          subscription_id: checkoutResponse.razorpay_subscription_id,
          content_name: plan.name,
          content_type: "subscription_plan",
          currency: "INR",
          value: getPlanTrackingValue(plan),
        });
        trackedPurchasesRef.current.add(checkoutResponse.razorpay_subscription_id);

        const refreshed = await loadCurrentSubscription({ silent: true });
        const isSubscriptionActive =
          !!refreshed && ACTIVE_SUBSCRIPTION_STATUSES.has(refreshed.status);

        if (refreshed) {
          setCurrentSubscription(refreshed);
        }

        if (isSubscriptionActive) {
          setMessageTone("success");
          setStatusMessage(
            `${plan.name} was activated successfully for ${user.email}. Opening the ShopKaBot workspace now...`,
          );
          routeToAppHome();
          return;
        }

        setMessageTone("info");
        setStatusMessage(
          `${plan.name} payment was verified. Waiting for the subscription record to become active before opening the app...`,
        );
        void pollForSubscriptionSync(subscription.subscriptionId, plan.name, plan);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to start Razorpay checkout.";

        if (checkoutFallbackLink && createdSubscriptionId) {
          try {
            await openFallbackCheckoutLink(checkoutFallbackLink);
            setMessageTone("info");
            setStatusMessage(
              `${message} We opened the fallback Razorpay checkout link so the payment can still continue.`,
            );
            void pollForSubscriptionSync(createdSubscriptionId, plan.name, plan);
          } catch (fallbackError) {
            setMessageTone("error");
            setStatusMessage(
              fallbackError instanceof Error
                ? fallbackError.message
                : message,
            );
          }
        } else {
          setMessageTone("error");
          setStatusMessage(message);
        }
      } finally {
        setActivePlanName(null);
      }
    },
    [
      checkoutFallbackLink,
      frontendRazorpayKeyId,
      loadCurrentSubscription,
      pollForSubscriptionSync,
      routeToAppHome,
      settings.apiBaseUrl,
      settings.businessName,
      user?.displayName,
      user?.email,
    ],
  );

  useEffect(() => {
    if (!user?.email || !pendingPlan) {
      return;
    }

    const nextPlan = pendingPlan;
    setPendingPlan(null);
    void startPlanCheckout(nextPlan);
  }, [pendingPlan, startPlanCheckout, user?.email]);

  const handleSwitchAccount = async () => {
    setMessageTone("info");
    setStatusMessage(
      "Choose the Google account that should own this ShopKaBot subscription.",
    );
    trackCustomEvent("checkout_google_signin_click", {
      source: user ? "switch_account" : "continue_with_google",
      page_path: "/get-started",
    });

    try {
      if (user) {
        await signOutUser();
      }
      await signInWithGooglePopup();
    } catch (error) {
      setMessageTone("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to switch Google account.",
      );
    }
  };

  const handleEnterpriseContact = () => {
    trackContact({
      content_name: enterpriseSubscriptionPlan?.name || "Enterprise / Agentic AI",
      content_type: "enterprise_sales",
    });

    if (enterpriseSubscriptionPlan?.contactUrl) {
      void Linking.openURL(enterpriseSubscriptionPlan.contactUrl);
      return;
    }

    void Linking.openURL(FRONTEND_APP_SUPPORT_WHATSAPP_LINK);
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.choosePlanPage}>
        <View style={styles.maxShell}>
          <View style={styles.checkoutIntroBlock}>
            <Text style={styles.checkoutBigHeadline}>
              Unlock the full power of automation.
            </Text>
            <Text style={styles.checkoutBigSubheadline}>
              Join growing businesses using ShopKaBot to respond faster,
              activate plans cleanly, and continue into the main web app
              without confusion.
            </Text>
          </View>

          <View style={[styles.checkoutLayout, isDesktop && styles.checkoutLayoutDesktop]}>
            <View style={styles.checkoutRightColumn}>
              <View style={styles.checkoutCard}>
                <View style={styles.checkoutCardHeader}>
                  <Text style={styles.checkoutCardTitle}>Choose your plan</Text>
                  <Text style={styles.checkoutCardSubtitle}>
                    Unlock all features. Google account is selected before payment.
                  </Text>
                </View>

                {statusMessage ? (
                  <StatusMessageBanner tone={messageTone} text={statusMessage} />
                ) : null}

                {subscriptionError ? (
                  <StatusMessageBanner tone="error" text={subscriptionError} />
                ) : null}

                {loadingSubscription ? (
                  <View style={styles.checkoutStatusRow}>
                    <ActivityIndicator color={palette.primaryGreen} />
                    <Text style={styles.checkoutStatusText}>
                      Checking current plan status...
                    </Text>
                  </View>
                ) : null}

                {currentSubscription ? (
                  <View style={styles.currentSubscriptionCard}>
                    <Text style={styles.currentSubscriptionTitle}>
                      Current plan: {currentSubscription.planName}
                    </Text>
                    <Text style={styles.currentSubscriptionMeta}>
                      Status: {formatStatusLabel(currentSubscription.status)}
                    </Text>
                    <Text style={styles.currentSubscriptionMeta}>
                      Gmail: {currentSubscription.gmailId}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.planPickerStack}>
                  {paidSubscriptionPlans.map((plan, index) => {
                    const isCurrentPlan =
                      currentSubscription?.planId === plan.planId &&
                      hasActiveSubscription;
                    const isBusy =
                      activePlanName === plan.name || pollingSubscription;

                    return (
                      <View
                        key={plan.name}
                        style={[
                          styles.planOptionCard,
                          index === 0 && styles.planOptionCardActive,
                        ]}
                      >
                        <View style={styles.planOptionHeader}>
                          <View>
                            <Text
                              style={[
                                styles.planOptionTitle,
                                index !== 0 && styles.planOptionTitleMuted,
                              ]}
                            >
                              {plan.name}
                            </Text>
                            <Text style={styles.planOptionSubtitle}>
                              {plan.total}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.planRadio,
                              (index === 0 || isCurrentPlan) && styles.planRadioSelected,
                            ]}
                          />
                        </View>

                        <Text style={styles.planAmountText}>
                          {plan.name === "12 Months"
                            ? "Pay Rs. 9,588"
                            : plan.name === "6 Months"
                              ? "Pay Rs. 5,394"
                              : "Pay Rs. 999"}
                        </Text>

                        <View style={styles.planBenefitList}>
                          {plan.bullets.map((bullet) => (
                            <ChecklistRow key={bullet} text={bullet} compact />
                          ))}
                        </View>

                        <Pressable
                          onPress={() => void startPlanCheckout(plan)}
                          disabled={isCurrentPlan || isBusy}
                          style={({ pressed }) => [
                            styles.checkoutActionButton,
                            (isCurrentPlan || isBusy) &&
                              styles.checkoutActionButtonDisabled,
                            pressed && !isCurrentPlan && styles.pressed,
                          ]}
                        >
                          <Text style={styles.checkoutActionButtonText}>
                            {isCurrentPlan
                              ? "Plan Active"
                              : isBusy
                                ? "Opening Checkout..."
                                : user?.email
                                  ? `Pay ${plan.total} & Start Now`
                                  : `Continue With Google For ${plan.name}`}
                          </Text>
                          {!isCurrentPlan ? (
                            <Ionicons
                              name="arrow-forward"
                              size={18}
                              color="#FFFFFF"
                            />
                          ) : null}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                {enterpriseSubscriptionPlan ? (
                  <Pressable
                    onPress={handleEnterpriseContact}
                    style={({ pressed }) => [
                      styles.enterpriseContactButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.enterpriseContactButtonText}>
                      {enterpriseSubscriptionPlan.buttonLabel}
                    </Text>
                  </Pressable>
                ) : null}

                <View style={styles.checkoutSecurityRow}>
                  <Text style={styles.checkoutSecurityText}>SSL Encrypted</Text>
                  <View style={styles.securityDot} />
                  <Text style={styles.checkoutSecurityText}>Instant Access</Text>
                </View>
              </View>

              <View style={styles.peopleViewingBar}>
                <Text style={styles.peopleViewingText}>
                  <Text style={styles.peopleViewingBold}>12 people</Text> are viewing
                  this page right now
                </Text>
              </View>
            </View>

            <View style={styles.checkoutLeftColumn}>
              <View style={styles.checkoutInfoPanel}>
                <View style={styles.checkoutInfoHeader}>
                  <Text style={styles.checkoutInfoHeaderText}>What happens next</Text>
                </View>
                <View style={styles.checkoutInfoBody}>
                  <ChecklistRow text="Choose the subscription that matches the business need." />
                  <ChecklistRow text="Use the Google account that should own the ShopKaBot workspace." />
                  <ChecklistRow text="Pay on Razorpay and continue into the main app with the same account." />
                  <ChecklistRow text="Connect WhatsApp Business after the plan becomes active." />
                </View>
              </View>

              <View style={styles.accountPanel}>
                <Text style={styles.accountPanelTitle}>Selected Google account</Text>
                {user ? (
                  <>
                    <View style={styles.accountChip}>
                      <Ionicons
                        name="logo-google"
                        size={18}
                        color={palette.darkWhatsappGreen}
                      />
                      <View style={styles.accountChipCopy}>
                        <Text style={styles.accountChipTitle}>
                          {user.displayName || "ShopKaBot user"}
                        </Text>
                        <Text style={styles.accountChipText}>{user.email}</Text>
                      </View>
                    </View>
                    <View style={styles.accountPanelActions}>
                      <Pressable
                        onPress={handleSwitchAccount}
                        style={({ pressed }) => [
                          styles.secondaryGhostButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.secondaryGhostButtonText}>Use Another Account</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.accountPanelHint}>
                      Sign in first so the subscription is attached to the right
                      account.
                    </Text>
                    <Pressable
                      onPress={handleSwitchAccount}
                      style={({ pressed }) => [
                        styles.googlePrimaryButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                      <Text style={styles.googlePrimaryButtonText}>Continue With Google</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function CountdownChunk({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.countdownChunk}>
      <Text style={styles.countdownValue}>{value}</Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </View>
  );
}

function TrustPills({ darkText = false }: { darkText?: boolean }) {
  return (
    <View style={styles.trustPillRow}>
      {["Meta Verified", "100% Organic Growth", "Instant Setup"].map((item) => (
        <View key={item} style={styles.trustPill}>
          <Text style={[styles.trustCheck, darkText && styles.trustCheckDark]}>âœ“</Text>
          <Text style={[styles.trustPillText, darkText && styles.trustPillTextDark]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CreatorTileCard(props: {
  name: string;
  count: string;
  tag: string;
  source: number;
}) {
  return (
    <View style={styles.creatorTile}>
      <Image source={props.source} style={styles.creatorTileImage} resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.creatorTileOverlay}
      >
        <Text style={styles.creatorTileName}>{props.name}</Text>
        <Text style={styles.creatorTileCount}>{props.count}</Text>
      </LinearGradient>
      <View style={styles.creatorTag}>
        <Text style={styles.creatorTagText}>{props.tag}</Text>
      </View>
    </View>
  );
}

function PlaceholderShowcase(props: {
  source: number;
  label: string;
  title: string;
  subtitle: string;
  large?: boolean;
}) {
  return (
    <View style={[styles.placeholderShowcase, props.large && styles.placeholderShowcaseLarge]}>
      <Image
        source={props.source}
        style={[
          styles.placeholderShowcaseImage,
          props.large && styles.placeholderShowcaseImageLarge,
        ]}
        resizeMode="cover"
      />
      <View style={styles.placeholderBadge}>
        <Text style={styles.placeholderBadgeText}>{props.label}</Text>
      </View>
      <View style={styles.placeholderCaption}>
        <Text style={styles.placeholderCaptionTitle}>{props.title}</Text>
        <Text style={styles.placeholderCaptionText}>{props.subtitle}</Text>
      </View>
    </View>
  );
}

function FormulaCard(props: {
  title: string;
  description: string;
  source: number;
  dark?: boolean;
}) {
  return (
    <View style={[styles.formulaCard, props.dark && styles.formulaCardDark]}>
      <Image source={props.source} style={styles.formulaImage} resizeMode="cover" />
      <Text style={[styles.formulaTitle, props.dark && styles.formulaTitleDark]}>
        {props.title}
      </Text>
      <Text
        style={[
          styles.formulaDescription,
          props.dark && styles.formulaDescriptionDark,
        ]}
      >
        {props.description}
      </Text>
    </View>
  );
}

function AlternatingFeatureSection(props: {
  title: string;
  description: string;
  source: number;
  reverse?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <View style={styles.whiteSection}>
      <View
        style={[
          styles.maxShell,
          isDesktop && styles.alternatingGrid,
          isDesktop && props.reverse && styles.alternatingGridReverse,
        ]}
      >
        <PlaceholderShowcase
          source={props.source}
          label="Placeholder preview"
          title={props.title}
          subtitle="ShopKaBot visual placeholder"
        />
        <View style={styles.sideCopyBlock}>
          <Text style={styles.sideFeatureTitle}>{props.title}</Text>
          <Text style={styles.sideFeatureDescription}>{props.description}</Text>
          <Pressable
            onPress={() => navigateToPublicWebRoute("get-started")}
            style={({ pressed }) => [
              styles.secondaryBlueButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryBlueButtonText}>Get Instant Access</Text>
          </Pressable>
          <TrustPills darkText />
        </View>
      </View>
    </View>
  );
}

function TestimonialCard(props: {
  name: string;
  handle: string;
  text: string;
}) {
  return (
    <View style={styles.testimonialCard}>
      <View style={styles.testimonialHeader}>
        <Text style={styles.testimonialName}>{props.name}</Text>
        <Text style={styles.testimonialHandle}>{props.handle}</Text>
      </View>
      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Text key={index} style={styles.star}>
            â˜…
          </Text>
        ))}
      </View>
      <Text style={styles.testimonialText}>{props.text}</Text>
    </View>
  );
}

function ChecklistRow({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.checklistRow}>
      <Ionicons
        name="checkmark-circle"
        size={compact ? 15 : 16}
        color={palette.primaryGreen}
      />
      <Text style={[styles.checklistText, compact && styles.checklistTextCompact]}>
        {text}
      </Text>
    </View>
  );
}

function StatusMessageBanner(props: { tone: MessageTone; text: string }) {
  return (
    <View
      style={[
        styles.statusBanner,
        props.tone === "success" && styles.statusBannerSuccess,
        props.tone === "error" && styles.statusBannerError,
      ]}
    >
      <Ionicons
        name={
          props.tone === "success"
            ? "checkmark-circle"
            : props.tone === "error"
              ? "warning"
              : "information-circle"
        }
        size={18}
        color={
          props.tone === "success"
            ? "#067647"
            : props.tone === "error"
              ? "#b42318"
              : palette.darkWhatsappGreen
        }
      />
      <Text
        style={[
          styles.statusBannerText,
          props.tone === "success" && styles.statusBannerTextSuccess,
          props.tone === "error" && styles.statusBannerTextError,
        ]}
      >
        {props.text}
      </Text>
    </View>
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

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  pageContent: {
    paddingBottom: 0,
  },
  maxShell: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  maxShellWide: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  discountBar: {
    backgroundColor: "#ef0000",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    zIndex: 20,
  },
  discountBarInner: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  discountBarInnerDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  discountCopyBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  discountCopyBlockDesktop: {
    flex: 1,
    alignItems: "flex-start",
  },
  discountCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexShrink: 1,
  },
  discountCountdownBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  discountCountdownBlockDesktop: {
    flex: 1,
  },
  discountEmoji: {
    fontSize: 22,
  },
  discountCopy: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  discountCountdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  discountButtonBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  discountButtonBlockDesktop: {
    flex: 1,
    alignItems: "flex-end",
  },
  countdownChunk: {
    alignItems: "center",
    minWidth: 54,
  },
  countdownValue: {
    color: "#facc15",
    fontFamily: typography.extrabold,
    fontSize: 24,
    lineHeight: 26,
  },
  countdownLabel: {
    color: "#ffffff",
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  discountColon: {
    color: "#facc15",
    fontFamily: typography.extrabold,
    fontSize: 24,
    marginBottom: 16,
  },
  discountButton: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  discountButtonDesktop: {
    minWidth: 166,
  },
  discountButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 15,
  },
  salesPage: {
    backgroundColor: "#ffffff",
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 48,
    backgroundColor: "#ffffff",
  },
  logoLockup: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  salesLogo: {
    width: 164,
    height: 62,
    resizeMode: "contain",
  },
  logoX: {
    fontSize: 30,
    color: "#9ca3af",
    fontFamily: typography.extrabold,
  },
  metaPlaceholder: {
    width: 164,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    marginBottom: 22,
  },
  rankBadgeEmoji: {
    fontSize: 22,
  },
  rankBadgeText: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 16,
    textAlign: "center",
  },
  heroHeadline: {
    maxWidth: 960,
    alignSelf: "center",
    textAlign: "center",
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 54,
    lineHeight: 60,
    marginBottom: 18,
  },
  highlightYellow: {
    backgroundColor: "rgba(250,204,21,0.6)",
  },
  highlightPink: {
    backgroundColor: "rgba(244,114,182,0.55)",
  },
  highlightPurple: {
    backgroundColor: "rgba(192,132,252,0.55)",
  },
  heroSubheadline: {
    maxWidth: 760,
    alignSelf: "center",
    textAlign: "center",
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 20,
    lineHeight: 30,
    marginBottom: 28,
  },
  primarySalesButton: {
    alignSelf: "center",
    backgroundColor: "#1b1aff",
    borderRadius: 14,
    paddingHorizontal: 34,
    paddingVertical: 18,
    shadowColor: "rgba(163,230,53,0.5)",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primarySalesButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  trustPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  trustCheck: {
    color: "#2563eb",
    fontSize: 17,
    fontFamily: typography.extrabold,
  },
  trustCheckDark: {
    color: "#1b1aff",
  },
  trustPillText: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 14,
  },
  trustPillTextDark: {
    color: "#111827",
  },
  heroVisualBlock: {
    marginTop: 36,
  },
  placeholderShowcase: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  placeholderShowcaseLarge: {
    maxWidth: 1080,
    alignSelf: "center",
  },
  placeholderShowcaseImage: {
    width: "100%",
    height: 320,
    backgroundColor: "#e5e7eb",
  },
  placeholderShowcaseImageLarge: {
    height: 520,
  },
  placeholderBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  placeholderBadgeText: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  placeholderCaption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "rgba(17,24,39,0.78)",
  },
  placeholderCaptionTitle: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  placeholderCaptionText: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: typography.medium,
    fontSize: 13,
    marginTop: 3,
  },
  creatorStripSection: {
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: "#ffffff",
  },
  creatorStripTitle: {
    color: "#9ca3af",
    fontFamily: typography.extrabold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },
  creatorStripRow: {
    paddingLeft: 12,
    paddingRight: 12,
    gap: 14,
  },
  creatorTile: {
    width: 144,
    height: 256,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#d1d5db",
  },
  creatorTileImage: {
    width: "100%",
    height: "100%",
  },
  creatorTileOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingTop: 42,
  },
  creatorTileName: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 11,
  },
  creatorTileCount: {
    color: "#d1d5db",
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 2,
  },
  creatorTag: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  creatorTagText: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 8,
    textTransform: "uppercase",
  },
  lightGreySection: {
    backgroundColor: "#f9fafb",
    paddingTop: 64,
    paddingBottom: 44,
  },
  sectionKickerBlue: {
    color: "#1b1aff",
    fontFamily: typography.bold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    textAlign: "center",
    marginBottom: 14,
  },
  sectionTitleCenter: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 36,
    lineHeight: 42,
    textAlign: "center",
    marginBottom: 28,
  },
  formulaGrid: {
    gap: 18,
  },
  formulaGridDesktop: {
    flexDirection: "row",
  },
  formulaCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 20,
    alignItems: "center",
  },
  formulaCardDark: {
    backgroundColor: "#111827",
  },
  formulaImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginBottom: 16,
  },
  formulaTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8,
  },
  formulaTitleDark: {
    color: "#ffffff",
  },
  formulaDescription: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  formulaDescriptionDark: {
    color: "#d1d5db",
  },
  whiteSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 54,
  },
  twoColumnFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  alternatingGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  alternatingGridReverse: {
    flexDirection: "row-reverse",
  },
  sideCopyBlock: {
    flex: 1,
    gap: 16,
  },
  sideFeatureTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 38,
    lineHeight: 44,
  },
  sideFeatureDescription: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 18,
    lineHeight: 28,
  },
  secondaryBlueButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1b1aff",
    borderRadius: 10,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  secondaryBlueButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  darkFeatureSection: {
    backgroundColor: "#111827",
    paddingTop: 64,
    paddingBottom: 54,
  },
  darkKicker: {
    color: "#9ca3af",
    fontFamily: typography.bold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    textAlign: "center",
    marginBottom: 12,
  },
  darkSectionTitle: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 46,
    lineHeight: 52,
    textAlign: "center",
    marginBottom: 28,
  },
  featureTileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureTile: {
    flexBasis: 260,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  featureTileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTileCopy: {
    flex: 1,
  },
  featureTileTitle: {
    color: "#ffffff",
    fontFamily: typography.bold,
    fontSize: 16,
    marginBottom: 6,
  },
  featureTileDescription: {
    color: "#d1d5db",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  centerActionWrap: {
    alignItems: "center",
    marginTop: 28,
  },
  testimonialSection: {
    backgroundColor: "#f9fafb",
    paddingVertical: 60,
  },
  testimonialRow: {
    gap: 18,
    paddingRight: 8,
  },
  testimonialCard: {
    width: 360,
    maxWidth: 500,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  testimonialHeader: {
    marginBottom: 14,
  },
  testimonialName: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  testimonialHandle: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 16,
    marginTop: 4,
  },
  starRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 14,
  },
  star: {
    color: "#facc15",
    fontSize: 28,
  },
  testimonialText: {
    color: "#374151",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  lightCtaStripSection: {
    backgroundColor: "#f9fafb",
    paddingBottom: 38,
  },
  faqSplit: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 40,
  },
  faqHeaderBlock: {
    flex: 0.7,
    alignItems: "center",
  },
  faqHeadline: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 40,
    lineHeight: 48,
    textAlign: "center",
  },
  blueWord: {
    color: "#1b1aff",
  },
  faqList: {
    flex: 1,
    gap: 14,
  },
  faqItem: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  faqAnswer: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    paddingVertical: 28,
  },
  footerInner: {
    gap: 18,
  },
  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  footerLogo: {
    width: 56,
    height: 56,
  },
  footerBrandText: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 22,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 18,
  },
  footerLink: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 14,
  },
  discountSubcopy: {
    color: "#fee2e2",
    fontFamily: typography.medium,
    fontSize: 14,
    textAlign: "center",
  },
  salesHeroPrice: {
    color: "#1b1aff",
    fontFamily: typography.extrabold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 18,
  },
  heroSupportCopy: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 16,
  },
  salesCtaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  salesChecklistGrid: {
    gap: 12,
    marginBottom: 24,
  },
  salesHeroDetailGrid: {
    gap: 20,
    marginTop: 32,
  },
  salesHeroDetailGridDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  salesHeroVisualColumn: {
    flex: 1.15,
  },
  salesHeroCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 24,
    gap: 14,
  },
  salesCardTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 28,
    lineHeight: 34,
  },
  salesCardText: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 26,
  },
  questionPillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  questionPill: {
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  questionPillText: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 14,
  },
  sectionDescriptionCenter: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 760,
    alignSelf: "center",
    marginTop: 18,
  },
  salesStatGrid: {
    gap: 16,
    marginTop: 28,
  },
  salesStatGridDesktop: {
    flexDirection: "row",
  },
  salesMetricCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    justifyContent: "space-between",
  },
  salesMetricValue: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 28,
    lineHeight: 34,
  },
  salesMetricLabel: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  salesStepGrid: {
    gap: 18,
  },
  salesStepGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  salesStepCard: {
    flexBasis: 380,
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 14,
  },
  salesStepTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 24,
    lineHeight: 30,
  },
  salesStepDescription: {
    color: "#374151",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 24,
  },
  salesStepBulletList: {
    gap: 10,
  },
  salesStepFooter: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 14,
    lineHeight: 22,
  },
  salesInfoGrid: {
    gap: 16,
  },
  salesInfoGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  salesInfoCard: {
    flexBasis: 250,
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    gap: 10,
  },
  salesInfoCardTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 19,
    lineHeight: 24,
  },
  salesInfoCardText: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  salesSplitGrid: {
    gap: 20,
  },
  salesSplitGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  salesCompactChecklist: {
    gap: 10,
  },
  salesPowerGrid: {
    gap: 12,
    maxWidth: 860,
    alignSelf: "center",
  },
  exampleReplyGrid: {
    gap: 16,
  },
  exampleReplyGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  exampleReplyCard: {
    flexBasis: 330,
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 22,
    gap: 8,
  },
  exampleReplyLabel: {
    color: "#1b1aff",
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  exampleReplyPrompt: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 18,
    lineHeight: 24,
  },
  exampleReplyBody: {
    color: "#374151",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  exampleReplyMedia: {
    color: "#111827",
    fontFamily: typography.bold,
    fontSize: 13,
    marginTop: 4,
  },
  launchPlanCard: {
    flex: 1.05,
    borderRadius: 28,
    backgroundColor: "#111827",
    padding: 26,
    gap: 16,
  },
  launchPlanLabel: {
    color: "#93c5fd",
    fontFamily: typography.bold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  launchPlanPrice: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 40,
    lineHeight: 46,
  },
  launchPlanDescription: {
    color: "#d1d5db",
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  launchPlanNote: {
    color: "#e5e7eb",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  salesSideStack: {
    flex: 1,
    gap: 20,
  },
  salesBenefitList: {
    gap: 14,
  },
  salesBenefitItem: {
    gap: 4,
  },
  salesBenefitTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 17,
  },
  salesBenefitText: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  salesDarkBody: {
    color: "#d1d5db",
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 760,
    alignSelf: "center",
  },
  salesDarkChecklist: {
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  finalCtaHeadline: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 18,
  },
  salesQuoteGrid: {
    gap: 16,
  },
  salesQuoteGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  salesQuoteCard: {
    flexBasis: 280,
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 22,
    gap: 12,
  },
  salesQuoteText: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 19,
    lineHeight: 27,
  },
  salesQuoteBody: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  footerCtaBlock: {
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  footerCtaTitle: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
  },
  footerCtaText: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 760,
  },
  footerTagline: {
    color: "#4b5563",
    fontFamily: typography.medium,
    fontSize: 13,
    marginTop: 2,
  },
  secondaryHeroButton: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  secondaryHeroButtonText: {
    color: "#111827",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  secondaryDarkButton: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  secondaryDarkButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  choosePlanPage: {
    minHeight: "100%",
    backgroundColor: "#f6fbf7",
    paddingVertical: 48,
  },
  checkoutLayout: {
    gap: 24,
  },
  checkoutLayoutDesktop: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  checkoutLeftColumn: {
    flex: 1,
    gap: 22,
  },
  checkoutRightColumn: {
    flex: 0.95,
  },
  chooseTrustedHeader: {
    paddingTop: 8,
  },
  useCasesWrap: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    backgroundColor: "#F7FFF9",
    padding: 22,
    gap: 18,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  useCasesHeader: {
    gap: 8,
  },
  useCasesKicker: {
    color: "#94A3B8",
    fontFamily: typography.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  useCasesTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 26,
    lineHeight: 32,
  },
  useCasesSubtitle: {
    color: "#475569",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 760,
  },
  useCasesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  useCasesScrollRow: {
    gap: 12,
    paddingRight: 6,
  },
  useCaseCardMobile: {
    width: 286,
  },
  useCaseCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 12,
    shadowColor: "rgba(15, 23, 42, 0.06)",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  useCaseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  useCaseIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },
  useCaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
  },
  useCaseBadgeText: {
    color: "#15803D",
    fontFamily: typography.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  useCaseTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 17,
  },
  useCaseHeadline: {
    color: "#334155",
    fontFamily: typography.bold,
    fontSize: 15,
    lineHeight: 22,
  },
  useCaseChatStack: {
    gap: 10,
  },
  useCaseCustomerBubble: {
    alignSelf: "flex-start",
    maxWidth: "84%",
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  useCaseCustomerLabel: {
    color: "#64748B",
    fontFamily: typography.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  useCaseCustomerText: {
    color: "#334155",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  useCaseBotBubble: {
    alignSelf: "flex-end",
    maxWidth: "90%",
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  useCaseBotLabel: {
    color: "#15803D",
    fontFamily: typography.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  useCaseBotText: {
    color: "#1F2937",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  useCaseMediaPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  useCaseMediaPillText: {
    color: "#0F172A",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  useCaseBenefit: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  useCasesTrustStrip: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    padding: 16,
    gap: 12,
  },
  useCasesTrustTitle: {
    color: "#0F172A",
    fontFamily: typography.bold,
    fontSize: 15,
  },
  useCasesTrustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  useCasesTrustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
  },
  useCasesTrustChipText: {
    color: "#166534",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  useCasesFootnote: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  checkoutIntroBlock: {
    gap: 10,
  },
  checkoutBigHeadline: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 46,
    lineHeight: 52,
  },
  checkoutBigSubheadline: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 18,
    lineHeight: 28,
  },
  checkoutInfoPanel: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.12)",
    backgroundColor: "#ffffff",
    shadowColor: "#0f5132",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  checkoutInfoHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#0f5132",
  },
  checkoutInfoHeaderText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 17,
  },
  checkoutInfoBody: {
    padding: 20,
    gap: 12,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checklistText: {
    flex: 1,
    color: "#355646",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  checklistTextCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
  accountPanel: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.12)",
    padding: 20,
    gap: 14,
    shadowColor: "#0f5132",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  accountPanelTitle: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  accountPanelHint: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  accountChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.1)",
    backgroundColor: "#f6fbf7",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accountChipCopy: {
    flex: 1,
  },
  accountChipTitle: {
    color: "#092313",
    fontFamily: typography.bold,
    fontSize: 15,
  },
  accountChipText: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 13,
    marginTop: 3,
  },
  accountPanelActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryGhostButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.16)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryGhostButtonText: {
    color: "#14532d",
    fontFamily: typography.bold,
    fontSize: 14,
  },
  googlePrimaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: CHECKOUT_BUTTON_GREEN,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  googlePrimaryButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 15,
  },
  checkoutCard: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.12)",
    overflow: "hidden",
    shadowColor: "#0f5132",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  checkoutCardHeader: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: "#f6fbf7",
  },
  checkoutCardTitle: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 30,
  },
  checkoutCardSubtitle: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 14,
    marginTop: 6,
  },
  statusBanner: {
    marginHorizontal: 22,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#edf7ef",
    borderWidth: 1,
    borderColor: "#cdeed6",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  statusBannerSuccess: {
    backgroundColor: "#ecfdf3",
    borderColor: "#abefc6",
  },
  statusBannerError: {
    backgroundColor: "#fef3f2",
    borderColor: "#fecdca",
  },
  statusBannerText: {
    flex: 1,
    color: "#166534",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  statusBannerTextSuccess: {
    color: "#067647",
  },
  statusBannerTextError: {
    color: "#b42318",
  },
  checkoutStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  checkoutStatusText: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 13,
  },
  currentSubscriptionCard: {
    marginHorizontal: 22,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: "#f6fbf7",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.1)",
    padding: 16,
    gap: 4,
  },
  currentSubscriptionTitle: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 16,
  },
  currentSubscriptionMeta: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 13,
  },
  planPickerStack: {
    paddingHorizontal: 22,
    gap: 14,
    paddingBottom: 20,
  },
  planOptionCard: {
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.12)",
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#ffffff",
  },
  planOptionCardActive: {
    borderColor: palette.primaryGreen,
    backgroundColor: "#f6fbf7",
  },
  planOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  planOptionTitle: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  planOptionTitleMuted: {
    color: "#4a6758",
  },
  planOptionSubtitle: {
    color: "#5d786a",
    fontFamily: typography.medium,
    fontSize: 13,
    marginTop: 4,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  planRadioSelected: {
    borderColor: palette.primaryGreen,
    backgroundColor: palette.primaryGreen,
  },
  planAmountText: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 28,
    marginTop: 16,
  },
  planBenefitList: {
    gap: 8,
    marginTop: 12,
  },
  checkoutActionButton: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: CHECKOUT_BUTTON_GREEN,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutActionButtonDisabled: {
    opacity: 0.7,
  },
  checkoutActionButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 16,
    textAlign: "center",
  },
  enterpriseContactButton: {
    marginHorizontal: 22,
    marginBottom: 18,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: CHECKOUT_BUTTON_GREEN,
    backgroundColor: CHECKOUT_BUTTON_GREEN,
  },
  enterpriseContactButtonText: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  checkoutSecurityRow: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutSecurityText: {
    color: "#5d786a",
    fontFamily: typography.bold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  securityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#86d39f",
  },
  peopleViewingBar: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(22, 101, 52, 0.12)",
    backgroundColor: "#edf7ef",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  peopleViewingText: {
    color: "#4a6758",
    fontFamily: typography.medium,
    fontSize: 11,
  },
  peopleViewingBold: {
    color: "#14532d",
    fontFamily: typography.extrabold,
  },
  pressed: {
    opacity: 0.92,
  },
});


