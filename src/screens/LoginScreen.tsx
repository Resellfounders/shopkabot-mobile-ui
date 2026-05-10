import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { signInWithGooglePopup } from "../services/firebase";
import {
  initializeWebTracking,
  trackCustomEvent,
  trackPageView,
  trackViewContent,
} from "../services/marketingTracking";
import { typography } from "../theme/palette";

WebBrowser.maybeCompleteAuthSession();

const trustedBusinesses = [
  "The Clumsy Studio",
  "Hitman Fashion",
  "Surat Textile Sellers",
  "Mumbai Fashion Stores",
  "Ahmedabad Boutique Owners",
];

const chatMessages = [
  {
    from: "customer",
    text: "Hi, price kya hai?",
    time: "10:21 AM",
  },
  {
    from: "bot",
    text: "Hello 😊 Yeh product ₹999 ka hai. Size/color bata dijiye?",
    time: "10:21 AM",
  },
  {
    from: "customer",
    text: "Delivery Mumbai me available hai?",
    time: "10:22 AM",
  },
  {
    from: "bot",
    text: "Yes 🚚 Mumbai delivery available hai. Main aapka order confirm kar du?",
    time: "10:22 AM",
  },
  {
    from: "customer",
    text: "Haan, payment link bhejo",
    time: "10:23 AM",
  },
];

const features = [
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "WhatsApp AI Replies",
    description:
      "Reply instantly to common customer enquiries on WhatsApp without needing your team online all the time.",
  },
  {
    icon: "cart-outline" as const,
    title: "AI Sales Assistant",
    description:
      "Suggest products, answer price questions, share delivery details, and guide customers toward placing orders.",
  },
  {
    icon: "flash-outline" as const,
    title: "Smart Follow-ups",
    description:
      "Automatically follow up with interested leads so fewer enquiries are missed and more chats turn into sales.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Business Ready Setup",
    description:
      "Simple Google login, WhatsApp Business connection, secure workflows, and guided onboarding support.",
  },
];

const benefits = [
  "Save hours every day on repetitive WhatsApp replies",
  "Instant AI responses to customer enquiries 24/7",
  "Convert more leads before customers lose interest",
  "Let AI share price, delivery, product, and order details",
  "Best for shops, studios, service businesses, and online sellers",
  "Deploy quickly with simple Google sign in and guided setup",
];

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const { signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  const chatAnimation = useRef(new Animated.Value(0)).current;
  const typingPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chatAnimation, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.delay(700),
        Animated.timing(chatAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(typingPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(typingPulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [chatAnimation, typingPulse]);

  const chatStackTranslateY = chatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -22],
  });

  const latestMessageOpacity = chatAnimation.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.12, 1, 1],
  });

  const typingOpacity = typingPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const typingScale = typingPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  const googleConfig = useMemo(
    () => ({
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
    }),
    [],
  );

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest(googleConfig);

  const canLogin =
    Platform.OS === "web" ? !submitting : Boolean(request) && !submitting;

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    initializeWebTracking();
    trackPageView({
      pagePath: "/",
      pageTitle: "ShopKaBot | Login",
    });
    trackViewContent({
      content_name: "ShopKaBot Login",
      content_type: "app_entry",
    });
  }, []);

  useEffect(() => {
    const idToken =
      response?.type === "success" ? response.params.id_token : undefined;

    if (response && response.type !== "success") {
      setSubmitting(false);
      return;
    }

    if (!idToken) {
      return;
    }

    setSubmitting(true);
    signInWithGoogle(idToken)
      .catch((error) => {
        Alert.alert(
          "Login failed",
          error instanceof Error ? error.message : "Please try again.",
        );
      })
      .finally(() => setSubmitting(false));
  }, [response, signInWithGoogle]);

  const handleGoogleLogin = async () => {
    if (Platform.OS === "web") {
      trackCustomEvent("login_cta_click", {
        destination: "google_sign_in",
        page_path: "/",
      });
    }

    if (Platform.OS === "web") {
      try {
        setSubmitting(true);
        await signInWithGooglePopup();
      } catch (error) {
        Alert.alert(
          "Login failed",
          error instanceof Error
            ? error.message
            : "Unable to sign in with Google.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!googleConfig.androidClientId) {
      Alert.alert(
        "Missing Google client ID",
        "Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in your .env before testing Google login.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const result = await promptAsync();

      if (result.type !== "success") {
        setSubmitting(false);
      }
    } catch {
      Alert.alert("Login failed", "Unable to open Google sign in.");
      setSubmitting(false);
    }
  };

  const handleEnterApp = () => {
    void handleGoogleLogin();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#2563EB", "#7C3AED"]}
        style={styles.heroSection}
      >
        <View style={styles.heroGlowLeft} />
        <View style={styles.heroGlowRight} />

        <View style={styles.container}>
          <View style={[styles.navbar, isTablet && styles.navbarDesktop]}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandName}>ShopKaBot</Text>
              <Text style={styles.brandTag}>Your Personal AI Agent</Text>
            </View>

            <Pressable
              disabled={!canLogin}
              onPress={handleEnterApp}
              style={({ pressed }) => [
                styles.signInButton,
                pressed && styles.ctaPressed,
                !canLogin && styles.ctaDisabled,
              ]}
            >
              <Ionicons name="logo-google" size={18} color="#2563EB" />
              <Text style={styles.signInButtonText}>
                {submitting ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.heroRow, isDesktop && styles.heroRowDesktop]}>
            <View style={styles.heroCopy}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  Built for WhatsApp-first businesses
                </Text>
              </View>

              <Text style={styles.heroTitleBrand}>ShopKaBot</Text>

              <Text style={styles.heroSubtitleBrand}>
                Your Personal AI Agent
              </Text>

              <Text style={styles.heroTitle}>
                WhatsApp AI Assistant for Indian Businesses
              </Text>

              <Text style={styles.heroDescription}>
                ShopKaBot replies to customer enquiries, shares product details,
                follows up with leads, and helps businesses convert WhatsApp
                chats into orders - even when your team is busy.
              </Text>

              <Pressable
                disabled={!canLogin}
                onPress={handleEnterApp}
                style={({ pressed }) => [
                  styles.primaryHeroButton,
                  pressed && styles.ctaPressed,
                  !canLogin && styles.ctaDisabled,
                ]}
              >
                <Text style={styles.primaryHeroButtonText}>
                  {submitting ? "Signing in..." : "Get Started"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#2563EB" />
              </Pressable>

              <View style={styles.trustRow}>
                <View style={styles.avatarRow}>
                  {["GJ", "MH", "IN"].map((item, index) => (
                    <View
                      key={item}
                      style={[
                        styles.avatarBubble,
                        index > 0 && styles.avatarBubbleOverlap,
                      ]}
                    >
                      <Text style={styles.avatarBubbleText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.trustText}>
                  Trusted by 100+ businesses across Mumbai, Gujarat, Surat &
                  Ahmedabad
                </Text>
              </View>
            </View>

            <View style={styles.heroVisualWrap}>
              <View style={styles.chatPhoneShell}>
                <LinearGradient
                  colors={["#075E54", "#128C7E"]}
                  style={styles.chatHeader}
                >
                  <View style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>S</Text>
                  </View>

                  <View style={styles.chatHeaderTextBlock}>
                    <Text style={styles.chatHeaderTitle}>ShopKaBot AI</Text>
                    <Text style={styles.chatHeaderSubtitle}>
                      Online - replying instantly
                    </Text>
                  </View>

                  <View style={styles.chatStatusPill}>
                    <View style={styles.chatStatusDot} />
                    <Text style={styles.chatStatusText}>Live</Text>
                  </View>
                </LinearGradient>

                <View style={styles.chatBody}>
                  <Animated.View
                    style={[
                      styles.chatStack,
                      {
                        transform: [{ translateY: chatStackTranslateY }],
                      },
                    ]}
                  >
                    {chatMessages.map((message, index) => {
                      const isBot = message.from === "bot";
                      const isLatest = index === chatMessages.length - 1;

                      return (
                        <Animated.View
                          key={`${message.from}-${index}`}
                          style={[
                            styles.chatBubble,
                            isBot ? styles.botBubble : styles.customerBubble,
                            isLatest && {
                              opacity: latestMessageOpacity,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chatBubbleText,
                              isBot && styles.botBubbleText,
                            ]}
                          >
                            {message.text}
                          </Text>

                          <Text style={styles.chatBubbleTime}>
                            {message.time}
                          </Text>
                        </Animated.View>
                      );
                    })}

                    <Animated.View
                      style={[
                        styles.typingBubble,
                        {
                          opacity: typingOpacity,
                          transform: [{ scale: typingScale }],
                        },
                      ]}
                    >
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </Animated.View>
                  </Animated.View>
                </View>

                <View style={styles.chatFooter}>
                  <Text style={styles.chatFooterText}>
                    AI is handling this enquiry
                  </Text>
                  <Ionicons name="checkmark-done" size={18} color="#25D366" />
                </View>
              </View>

              <View style={styles.trustedCard}>
                <Text style={styles.trustedCardTitle}>
                  Businesses that trust us
                </Text>

                <View style={styles.trustedLogoGrid}>
                  {trustedBusinesses.map((business) => (
                    <View key={business} style={styles.trustedLogoChip}>
                      <Text style={styles.trustedLogoText}>{business}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.lightSection}>
        <View style={styles.container}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Everything Your WhatsApp Business Needs
            </Text>

            <View style={styles.headingAccent} />

            <Text style={styles.sectionDescription}>
              Build, train, test, and launch your AI reply system without
              coding.
            </Text>
          </View>

          <View style={styles.featureGrid}>
            {features.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <LinearGradient
                  colors={["#2563EB", "#7C3AED"]}
                  style={styles.featureIconWrap}
                >
                  <Ionicons name={feature.icon} size={28} color="#FFFFFF" />
                </LinearGradient>

                <Text style={styles.featureCardTitle}>{feature.title}</Text>

                <Text style={styles.featureCardDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.whiteSection}>
        <View style={[styles.container, isDesktop && styles.benefitsRow]}>
          <View style={styles.benefitsVisualWrap}>
            <View style={styles.analyticsCard}>
              <LinearGradient
                colors={["#E0EAFF", "#F5F3FF"]}
                style={styles.analyticsHeader}
              >
                <View style={styles.dashboardHeaderRow}>
                  <View style={styles.dashboardTitleBlock}>
                    <Text style={styles.analyticsHeaderTitle}>
                      AI Sales Assistant Dashboard
                    </Text>

                    <Text style={styles.analyticsHeaderText}>
                      See how ShopKaBot handles enquiries, qualifies leads, and
                      pushes customers toward orders automatically.
                    </Text>
                  </View>

                  <View style={styles.magicBadge}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text style={styles.magicBadgeText}>AI Magic</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.analyticsBody}>
                <View style={styles.aiMetricGrid}>
                  <View style={styles.aiMetricCard}>
                    <Text style={styles.aiMetricValue}>1.2s</Text>
                    <Text style={styles.aiMetricLabel}>Avg AI reply time</Text>
                  </View>

                  <View style={styles.aiMetricCard}>
                    <Text style={styles.aiMetricValue}>68</Text>
                    <Text style={styles.aiMetricLabel}>Leads qualified</Text>
                  </View>

                  <View style={styles.aiMetricCard}>
                    <Text style={styles.aiMetricValue}>23</Text>
                    <Text style={styles.aiMetricLabel}>Orders assisted</Text>
                  </View>

                  <View style={styles.aiMetricCard}>
                    <Text style={styles.aiMetricValue}>0</Text>
                    <Text style={styles.aiMetricLabel}>Missed chats</Text>
                  </View>
                </View>

                <View style={styles.salesFunnelCard}>
                  <View style={styles.salesFunnelHeader}>
                    <Text style={styles.salesFunnelTitle}>
                      Today's AI sales flow
                    </Text>

                    <Text style={styles.salesFunnelSubtitle}>
                      {"Auto-replies -> product suggestion -> follow-up -> order intent"}
                    </Text>
                  </View>

                  <View style={styles.funnelRow}>
                    <Text style={styles.funnelLabel}>Customer enquiries</Text>
                    <View style={styles.funnelContentRow}>
                      <View style={styles.funnelTrack}>
                        <View style={[styles.funnelFill, { width: "92%" }]} />
                      </View>
                      <Text style={styles.funnelValue}>124</Text>
                    </View>
                  </View>

                  <View style={styles.funnelRow}>
                    <Text style={styles.funnelLabel}>AI replies sent</Text>
                    <View style={styles.funnelContentRow}>
                      <View style={styles.funnelTrack}>
                        <View style={[styles.funnelFill, { width: "86%" }]} />
                      </View>
                      <Text style={styles.funnelValue}>118</Text>
                    </View>
                  </View>

                  <View style={styles.funnelRow}>
                    <Text style={styles.funnelLabel}>Hot leads found</Text>
                    <View style={styles.funnelContentRow}>
                      <View style={styles.funnelTrack}>
                        <View style={[styles.funnelFill, { width: "58%" }]} />
                      </View>
                      <Text style={styles.funnelValue}>68</Text>
                    </View>
                  </View>

                  <View style={styles.funnelRow}>
                    <Text style={styles.funnelLabel}>Orders assisted</Text>
                    <View style={styles.funnelContentRow}>
                      <View style={styles.funnelTrack}>
                        <View style={[styles.funnelFill, { width: "34%" }]} />
                      </View>
                      <Text style={styles.funnelValue}>23</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.aiInsightBox}>
                  <Ionicons name="bulb-outline" size={20} color="#7C3AED" />

                  <Text style={styles.aiInsightText}>
                    AI noticed customers asking about delivery and price, so it
                    automatically replied with product info, delivery
                    availability, and order confirmation.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.benefitsCopy}>
            <Text style={styles.benefitsTitle}>
              Why Businesses Choose ShopKaBot
            </Text>

            <Text style={styles.benefitsSubtitle}>
              Your WhatsApp inbox should not slow down your sales. Let AI handle
              the repeat work while your team focuses on closing customers.
            </Text>

            <View style={styles.benefitList}>
              {benefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <LinearGradient
                    colors={["#2563EB", "#7C3AED"]}
                    style={styles.benefitIconWrap}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </LinearGradient>

                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <Pressable
              disabled={!canLogin}
              onPress={handleEnterApp}
              style={({ pressed }) => [
                styles.secondaryCtaButton,
                pressed && styles.secondaryCtaPressed,
                !canLogin && styles.ctaDisabled,
              ]}
            >
              <Text style={styles.secondaryCtaButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <LinearGradient colors={["#2563EB", "#7C3AED"]} style={styles.ctaSection}>
        <View style={styles.heroGlowLeft} />
        <View style={styles.heroGlowRight} />

        <View style={[styles.container, styles.ctaContainer]}>
          <Text style={styles.ctaTitle}>
            Ready to Automate Your WhatsApp Business?
          </Text>

          <Text style={styles.ctaDescription}>
            Start replying faster, converting more leads, and reducing manual
            customer support work with ShopKaBot.
          </Text>

          <Pressable
            disabled={!canLogin}
            onPress={handleEnterApp}
            style={({ pressed }) => [
              styles.primaryHeroButton,
              styles.finalCtaButton,
              pressed && styles.ctaPressed,
              !canLogin && styles.ctaDisabled,
            ]}
          >
            <Text style={styles.primaryHeroButtonText}>Start Building Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#2563EB" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ShopKaBot</Text>
        <Text style={styles.footerSubtext}>
          WhatsApp AI automation for growing Indian businesses.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 0,
  },
  container: {
    width: "100%",
    maxWidth: 1160,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  heroSection: {
    position: "relative",
    overflow: "hidden",
    paddingVertical: 28,
  },
  heroGlowLeft: {
    position: "absolute",
    top: "22%",
    left: "-8%",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroGlowRight: {
    position: "absolute",
    bottom: "10%",
    right: "-6%",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  navbar: {
    gap: 16,
    paddingBottom: 28,
  },
  navbarDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandBlock: {
    gap: 2,
  },
  brandName: {
    color: "#FFFFFF",
    fontFamily: typography.extrabold,
    fontSize: 28,
    lineHeight: 32,
  },
  brandTag: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: typography.bold,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  signInButton: {
    minHeight: 52,
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  signInButtonText: {
    color: "#2563EB",
    fontFamily: typography.bold,
    fontSize: 15,
  },
  heroRow: {
    gap: 24,
  },
  heroRowDesktop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 18,
    zIndex: 1,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitleBrand: {
    color: "#FFFFFF",
    fontFamily: typography.extrabold,
    fontSize: 54,
    lineHeight: 60,
    letterSpacing: -1,
  },
  heroSubtitleBrand: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: typography.bold,
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: typography.extrabold,
    fontSize: 38,
    lineHeight: 46,
    maxWidth: 680,
  },
  heroDescription: {
    color: "rgba(255,255,255,0.90)",
    fontFamily: typography.medium,
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 700,
  },
  primaryHeroButton: {
    minHeight: 58,
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  primaryHeroButtonText: {
    color: "#2563EB",
    fontFamily: typography.bold,
    fontSize: 17,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBubbleOverlap: {
    marginLeft: -8,
  },
  avatarBubbleText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  trustText: {
    color: "#FFFFFF",
    fontFamily: typography.medium,
    fontSize: 14,
    maxWidth: 520,
  },
  heroVisualWrap: {
    flex: 1,
  },
  chatPhoneShell: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#ECE5DD",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.85)",
  },
  chatHeader: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarText: {
    color: "#075E54",
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  chatHeaderTextBlock: {
    flex: 1,
  },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontFamily: typography.extrabold,
    fontSize: 17,
  },
  chatHeaderSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: 3,
  },
  chatStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#25D366",
  },
  chatStatusText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 11,
  },
  chatBody: {
    minHeight: 390,
    padding: 18,
    backgroundColor: "#ECE5DD",
    overflow: "hidden",
  },
  chatStack: {
    gap: 12,
  },
  chatBubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  customerBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 4,
  },
  botBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 4,
  },
  chatBubbleText: {
    color: "#111827",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  botBubbleText: {
    color: "#0F172A",
  },
  chatBubbleTime: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 5,
    alignSelf: "flex-end",
  },
  typingBubble: {
    alignSelf: "flex-end",
    borderRadius: 18,
    borderTopRightRadius: 4,
    backgroundColor: "#DCF8C6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#64748B",
  },
  chatFooter: {
    minHeight: 56,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatFooterText: {
    color: "#475569",
    fontFamily: typography.bold,
    fontSize: 13,
  },
  trustedCard: {
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  trustedCardTitle: {
    color: "#FFFFFF",
    fontFamily: typography.extrabold,
    fontSize: 16,
    marginBottom: 12,
  },
  trustedLogoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trustedLogoChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  trustedLogoText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  lightSection: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 56,
  },
  whiteSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 56,
  },
  sectionHeading: {
    alignItems: "center",
    gap: 10,
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
  },
  headingAccent: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },
  sectionDescription: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 620,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  featureCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    borderRadius: 18,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 14,
    shadowColor: "#2563EB",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  featureIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCardTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 18,
    textAlign: "center",
  },
  featureCardDescription: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  benefitsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  benefitsVisualWrap: {
    flex: 1,
  },
  analyticsCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  analyticsHeader: {
    padding: 20,
    gap: 8,
  },
  dashboardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  dashboardTitleBlock: {
    flex: 1,
  },
  analyticsHeaderTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 22,
  },
  analyticsHeaderText: {
    color: "#475569",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  magicBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  magicBadgeText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 11,
  },
  analyticsBody: {
    padding: 20,
    gap: 18,
  },
  aiMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  aiMetricCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "46%",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 5,
  },
  aiMetricValue: {
    color: "#2563EB",
    fontFamily: typography.extrabold,
    fontSize: 24,
  },
  aiMetricLabel: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  salesFunnelCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  salesFunnelHeader: {
    gap: 4,
  },
  salesFunnelTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 17,
  },
  salesFunnelSubtitle: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  funnelRow: {
    gap: 7,
  },
  funnelLabel: {
    color: "#334155",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  funnelContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  funnelTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  funnelFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#7C3AED",
  },
  funnelValue: {
    width: 34,
    color: "#2563EB",
    fontFamily: typography.extrabold,
    fontSize: 12,
    textAlign: "right",
  },
  aiInsightBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  aiInsightText: {
    flex: 1,
    color: "#475569",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  benefitsCopy: {
    flex: 1,
    gap: 14,
  },
  benefitsTitle: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 32,
    lineHeight: 38,
  },
  benefitsSubtitle: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 25,
  },
  benefitList: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    color: "#0F172A",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 24,
  },
  secondaryCtaButton: {
    minHeight: 54,
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  secondaryCtaPressed: {
    opacity: 0.92,
  },
  secondaryCtaButtonText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 16,
  },
  ctaSection: {
    position: "relative",
    overflow: "hidden",
    paddingVertical: 64,
  },
  ctaContainer: {
    alignItems: "center",
    gap: 16,
    zIndex: 1,
  },
  ctaTitle: {
    color: "#FFFFFF",
    fontFamily: typography.extrabold,
    fontSize: 38,
    lineHeight: 46,
    textAlign: "center",
    maxWidth: 760,
  },
  ctaDescription: {
    color: "rgba(255,255,255,0.90)",
    fontFamily: typography.medium,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 760,
  },
  finalCtaButton: {
    marginTop: 6,
    alignSelf: "center",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    color: "#0F172A",
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  footerSubtext: {
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 13,
    textAlign: "center",
  },
  ctaPressed: {
    transform: [{ scale: 0.99 }],
  },
  ctaDisabled: {
    opacity: 0.65,
  },
});
