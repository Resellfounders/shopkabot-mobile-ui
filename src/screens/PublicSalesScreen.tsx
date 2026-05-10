import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  businessProofCards,
  ctaBlocks,
  demoConversationCards,
  faqItems,
  featureCards,
  footerBullets,
  howItWorksSteps,
  pricingFeatures,
  salesSeo,
  statCards,
  useCaseCards,
} from "../content/shopkabotSales";
import {
  initializeWebTracking,
  trackCustomEvent,
  trackLead,
  trackPageView,
  trackViewContent,
} from "../services/marketingTracking";
import { palette, typography } from "../theme/palette";
import { navigateToPublicWebRoute } from "../utils/webEntry";
import { setWebPageMetadata } from "../utils/webMetadata";

type SectionKey = "demo" | "features" | "pricing" | "faq";
type IconName = ComponentProps<typeof Ionicons>["name"];

const brandLogo = require("../../assets/icon.png");
const heroBullets = [
  "AI replies trained on your business",
  "Sends images, PDFs & catalogs",
  "Hindi, Hinglish & English support",
] as const;
const basicLimitations = [
  "Same reply every time",
  "No chat context",
  "No smart follow-up",
  "Cannot guide customer",
  "Feels robotic",
] as const;
const aiBenefits = [
  "Uses your business training data",
  "Understands conversation summary",
  "Sends images, PDFs and catalogs",
  "Replies in Hindi, Hinglish or English",
  "Moves customers toward purchase",
] as const;
const heroConversationMessages = [
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
] as const;
const trustedBusinesses = [
  "The Clumsy Studio",
  "Hitman Fashion",
  "Surat Textile Sellers",
  "Mumbai Fashion Stores",
  "Ahmedabad Boutique Owners",
] as const;

function getLaunchOfferCountdown() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(24, 0, 0, 0);

  const remainingMs = Math.max(target.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function PublicSalesScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1100;
  const scrollRef = useRef<ScrollView | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [offerCountdown, setOfferCountdown] = useState(getLaunchOfferCountdown);
  const [sectionOffsets, setSectionOffsets] = useState<Record<SectionKey, number>>({
    demo: 0,
    features: 0,
    pricing: 0,
    faq: 0,
  });

  useEffect(() => {
    setWebPageMetadata(salesSeo);
    initializeWebTracking();
    trackPageView({
      pagePath: "/sales",
      pageTitle: salesSeo.title,
    });
    trackViewContent({
      content_name: "ShopKaBot Launch Plan",
      content_type: "subscription_plan",
      currency: "INR",
      value: 999,
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setOfferCountdown(getLaunchOfferCountdown());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const cardWidth = useMemo(() => {
    if (isDesktop) {
      return "23.5%";
    }

    if (isTablet) {
      return "48.5%";
    }

    return "100%";
  }, [isDesktop, isTablet]);

  const proofCardWidth = useMemo(() => {
    if (isDesktop || isTablet) {
      return "48.8%";
    }

    return "100%";
  }, [isDesktop, isTablet]);

  const registerSection = (key: SectionKey) => (event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    setSectionOffsets((current) =>
      current[key] === y
        ? current
        : {
            ...current,
            [key]: y,
          },
    );
  };

  const scrollToSection = (key: SectionKey) => {
    scrollRef.current?.scrollTo({
      y: Math.max(sectionOffsets[key] - 120, 0),
      animated: true,
    });
  };

  const handlePrimaryCta = () => {
    trackLead({
      content_name: "ShopKaBot Sales Page",
      content_type: "subscription_plan",
      currency: "INR",
      value: 999,
    });
    trackCustomEvent("sales_cta_click", {
      destination: "get_started",
      page_path: "/sales",
    });
    navigateToPublicWebRoute("get-started");
  };

  const handleDemoCta = () => {
    trackCustomEvent("sales_demo_click", {
      page_path: "/sales",
      section: "demo",
    });
    scrollToSection("demo");
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.offerBar}>
        <View style={styles.maxWidth}>
          <View style={[styles.offerBarInner, isDesktop && styles.offerBarInnerDesktop]}>
            <View style={styles.offerBarMeta}>
              <Text style={styles.offerBarCopy}>
                {isTablet
                  ? "\u{1F389} Launch Offer: Full WhatsApp AI Chatbot at \u20B9999/month"
                  : "\u{1F389} Launch Offer: \u20B9999/month"}
              </Text>
            </View>
            <View style={styles.offerBarActionRow}>
              <View style={styles.offerTimerWrap}>
                <Text style={styles.offerTimerLabel}>Offer ends today in</Text>
                <View style={styles.offerTimerRow}>
                  <View style={styles.offerTimerChip}>
                    <Text style={styles.offerTimerValue}>{offerCountdown.hours}</Text>
                    <Text style={styles.offerTimerUnit}>HRS</Text>
                  </View>
                  <View style={styles.offerTimerChip}>
                    <Text style={styles.offerTimerValue}>{offerCountdown.minutes}</Text>
                    <Text style={styles.offerTimerUnit}>MIN</Text>
                  </View>
                  <View style={styles.offerTimerChip}>
                    <Text style={styles.offerTimerValue}>{offerCountdown.seconds}</Text>
                    <Text style={styles.offerTimerUnit}>SEC</Text>
                  </View>
                </View>
              </View>
              <PrimaryButton
                label={isTablet ? "Start Now" : "Start"}
                onPress={handlePrimaryCta}
                compact
              />
            </View>
          </View>
        </View>
      </View>

      <LinearGradient
        colors={["#F0FDF4", "#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroWrap}
      >
        <View style={styles.maxWidth}>
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <View style={styles.brandRow}>
              <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
              <View>
                <Text style={styles.brandName}>ShopKaBot</Text>
                <Text style={styles.brandTagline}>WhatsApp AI Chatbot for Businesses</Text>
              </View>
            </View>

            {isDesktop ? (
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => scrollToSection("features")}
                  style={({ pressed }) => [styles.headerLink, pressed && styles.pressed]}
                >
                  <Text style={styles.headerLinkText}>Features</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => scrollToSection("pricing")}
                  style={({ pressed }) => [styles.headerLink, pressed && styles.pressed]}
                >
                  <Text style={styles.headerLinkText}>Pricing</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => scrollToSection("faq")}
                  style={({ pressed }) => [styles.headerLink, pressed && styles.pressed]}
                >
                  <Text style={styles.headerLinkText}>FAQs</Text>
                </Pressable>
                <PrimaryButton label="Get Instant Access" onPress={handlePrimaryCta} compact />
              </View>
            ) : (
              <PrimaryButton label="Get Instant Access" onPress={handlePrimaryCta} compact />
            )}
          </View>

          <View style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}>
            <View style={styles.heroCopyColumn}>
              <View style={styles.eyebrowPill}>
                <Ionicons name="logo-whatsapp" size={14} color={palette.darkWhatsappGreen} />
                <Text style={styles.eyebrowPillText}>WhatsApp AI chatbot for businesses</Text>
              </View>

              <Text style={styles.heroTitle}>Automate WhatsApp Replies With AI</Text>

              <Text style={styles.heroDescription}>
                ShopKaBot replies to customer messages instantly using your business
                training data. It can answer questions, send catalogs, share
                images/PDFs, and reply in English, Hindi or Hinglish.
              </Text>

              <Text style={styles.heroPricingLine}>
                {"Start at just \u20B9999/month. Setup support included."}
              </Text>

              <View style={styles.heroButtonRow}>
                <PrimaryButton label="Get Instant Access" onPress={handlePrimaryCta} />
                <SecondaryButton label="View Demo" onPress={handleDemoCta} icon="play-circle-outline" />
              </View>

              <Text style={styles.heroTrustLine}>
                Secure payment • Instant access • Cancel anytime
              </Text>

              <View style={styles.heroBulletStack}>
                {heroBullets.map((item) => (
                  <View key={item} style={styles.heroBulletRow}>
                    <Ionicons name="checkmark-circle" size={17} color={palette.primaryGreen} />
                    <Text style={styles.heroBulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.heroVisualColumn}>
              <View style={styles.heroVisualStack}>
                <View style={styles.salesPhoneShell}>
                  <LinearGradient
                    colors={["#075E54", "#128C7E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.salesChatHeader}
                  >
                    <View style={styles.salesChatAvatar}>
                      <Text style={styles.salesChatAvatarText}>S</Text>
                    </View>

                    <View style={styles.salesChatHeaderTextBlock}>
                      <Text style={styles.salesChatHeaderTitle}>ShopKaBot AI</Text>
                      <Text style={styles.salesChatHeaderSubtitle}>Online - replying instantly</Text>
                    </View>

                    <View style={styles.salesChatStatusPill}>
                      <View style={styles.salesChatStatusDot} />
                      <Text style={styles.salesChatStatusText}>Live</Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.salesChatBody}>
                    {heroConversationMessages.map((message, index) => {
                      const isBot = message.from === "bot";

                      return (
                        <View
                          key={`${message.from}-${index}`}
                          style={[
                            styles.salesChatBubble,
                            isBot ? styles.salesChatBubbleBot : styles.salesChatBubbleCustomer,
                          ]}
                        >
                          <Text
                            style={[
                              styles.salesChatBubbleText,
                              isBot && styles.salesChatBubbleTextBot,
                            ]}
                          >
                            {message.text}
                          </Text>
                          <Text style={styles.salesChatBubbleTime}>{message.time}</Text>
                        </View>
                      );
                    })}

                    <View style={styles.salesTypingBubble}>
                      <View style={styles.salesTypingDot} />
                      <View style={styles.salesTypingDot} />
                      <View style={styles.salesTypingDot} />
                    </View>
                  </View>

                  <View style={styles.salesChatFooter}>
                    <Text style={styles.salesChatFooterText}>AI is handling this enquiry</Text>
                    <Ionicons name="checkmark-done" size={18} color={palette.primaryGreen} />
                  </View>
                </View>

                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.88)", "rgba(99, 102, 241, 0.76)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.trustedBusinessesCard}
                >
                  <Text style={styles.trustedBusinessesTitle}>Businesses that trust us</Text>
                  <View style={styles.trustedBusinessesGrid}>
                    {trustedBusinesses.map((business) => (
                      <View key={business} style={styles.trustedBusinessChip}>
                        <Text style={styles.trustedBusinessChipText}>{business}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <SectionShell>
        <SectionHeader
          kicker="Built for real business categories"
          title="Trusted by businesses that already sell on WhatsApp"
          description="From retail and coaching to clinics and local services, ShopKaBot adapts to the way your enquiries actually come in."
        />

        <View style={styles.gridWrap}>
          {useCaseCards.map((item) => (
            <InfoCard key={item.title} width={cardWidth}>
              <View style={styles.iconBadge}>
                <Ionicons name={item.icon as IconName} size={20} color={palette.darkWhatsappGreen} />
              </View>
              <Text style={styles.infoCardTitle}>{item.title}</Text>
              <Text style={styles.infoCardBody}>{item.benefit}</Text>
            </InfoCard>
          ))}
        </View>
      </SectionShell>

      <SectionShell tone="soft">
        <View style={styles.statsRow}>
          {statCards.map((item) => (
            <View
              key={item.label}
              style={[
                styles.statCard,
                isDesktop
                  ? styles.statCardDesktop
                  : isTablet
                    ? styles.statCardTablet
                    : styles.statCardMobile,
              ]}
            >
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </SectionShell>

      <SectionShell>
        <SectionHeader
          kicker="How It Works"
          title="The Simple Formula to Automate WhatsApp Sales Conversations"
          description="Train once, test confidently, and let the AI keep conversations moving forward."
        />

        <View style={styles.gridWrap}>
          {howItWorksSteps.map((item) => (
            <InfoCard
              key={item.title}
              width={isDesktop ? "48.8%" : "100%"}
              backgroundColor="#ffffff"
            >
              <Text style={styles.stepLabel}>{item.step}</Text>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.description}</Text>
            </InfoCard>
          ))}
        </View>
      </SectionShell>

      <SectionShell tone="soft">
        <ComparisonSection
          isDesktop={isDesktop}
          onPrimaryCta={handlePrimaryCta}
          onDemoCta={handleDemoCta}
        />
      </SectionShell>

      <SectionShell onLayout={registerSection("demo")}>
        <SectionHeader
          kicker="Real WhatsApp Demo Conversations"
          title="See how the AI can respond in everyday chat situations"
          description="These are the kinds of fast, natural replies that help businesses answer faster and convert more enquiries."
        />

        <View style={styles.gridWrap}>
          {demoConversationCards.map((item) => (
            <InfoCard
              key={item.title}
              width={isDesktop ? "48.8%" : "100%"}
              backgroundColor="#fcfffd"
            >
              <Text style={styles.demoLabel}>{item.title}</Text>
              <View style={styles.demoBubbleCustomer}>
                <Text style={styles.demoBubbleCustomerText}>Customer: {item.customer}</Text>
              </View>
              <View style={styles.demoBubbleBot}>
                <Text style={styles.demoBubbleBotText}>Bot: {item.bot}</Text>
              </View>
              {item.media ? (
                <View style={styles.demoMediaChip}>
                  <Text style={styles.demoMediaChipText}>{item.media}</Text>
                </View>
              ) : null}
            </InfoCard>
          ))}
        </View>
      </SectionShell>

      <SectionShell tone="soft" onLayout={registerSection("features")}>
        <SectionHeader
          kicker="All The Features You Need"
          title="Unlock the Full Power of WhatsApp AI Automation"
          description="Everything from training and testing to multilingual replies and smart media sending."
        />

        <View style={styles.gridWrap}>
          {featureCards.map((item) => (
            <InfoCard
              key={item.title}
              width={cardWidth}
              backgroundColor="#ffffff"
            >
              <View style={styles.iconBadge}>
                <Ionicons name={item.icon as IconName} size={20} color={palette.darkWhatsappGreen} />
              </View>
              <Text style={styles.infoCardTitle}>{item.title}</Text>
              <Text style={styles.infoCardBody}>{item.description}</Text>
            </InfoCard>
          ))}
        </View>
      </SectionShell>

      <SectionShell>
        <View style={styles.ctaBlockStack}>
          {ctaBlocks.map((item, index) => (
            <LinearGradient
              key={item.title}
              colors={
                index === 0
                  ? ["#0d2c1c", "#1d6139"]
                  : index === 1
                    ? ["#0f5132", "#25D366"]
                    : ["#f1fff6", "#dff7e7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.ctaBlock,
                index === 2 && styles.ctaBlockLight,
              ]}
            >
              <View style={styles.ctaCopy}>
                <Text style={[styles.ctaTitle, index === 2 && styles.ctaTitleLight]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.ctaDescription,
                    index === 2 && styles.ctaDescriptionLight,
                  ]}
                >
                  {item.description}
                </Text>
                <View style={styles.ctaBulletRow}>
                  {item.bullets.map((bullet) => (
                    <View
                      key={`${item.title}-${bullet}`}
                      style={[styles.ctaBulletChip, index === 2 && styles.ctaBulletChipLight]}
                    >
                      <Text
                        style={[
                          styles.ctaBulletChipText,
                          index === 2 && styles.ctaBulletChipTextLight,
                        ]}
                      >
                        {bullet}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.ctaAction}>
                <PrimaryButton
                  label={item.buttonLabel}
                  onPress={handlePrimaryCta}
                  inverse={index !== 2}
                />
              </View>
            </LinearGradient>
          ))}
        </View>
      </SectionShell>

      <SectionShell tone="soft" onLayout={registerSection("pricing")}>
        <SectionHeader
          kicker="Simple Pricing for Businesses"
          title="Start with one launch plan"
          description="No complicated CRM. No expensive software. No technical knowledge needed."
        />

        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeText}>Launch Plan</Text>
          </View>
          <Text style={styles.pricingAmount}>₹999/month</Text>
          <Text style={styles.pricingSubtitle}>
            Everything you need to start WhatsApp AI automation.
          </Text>

          <View style={styles.pricingFeatureList}>
            {pricingFeatures.map((item) => (
              <View key={item} style={styles.pricingFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={palette.primaryGreen} />
                <Text style={styles.pricingFeatureText}>{item}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton label="Get Started at ₹999/month" onPress={handlePrimaryCta} />
          <Text style={styles.pricingNote}>
            No complicated CRM. No expensive software. No technical knowledge needed.
          </Text>
        </View>
      </SectionShell>

      <SectionShell tone="soft">
        <SectionHeader
          kicker="Why businesses choose ShopKaBot"
          title="Built for the WhatsApp work your team repeats every day"
          description="From first replies and media sharing to qualification and multilingual chats, ShopKaBot is designed to remove repetitive manual work without making conversations feel robotic."
        />

        <View style={styles.gridWrap}>
          {businessProofCards.map((item) => (
            <ProofCard
              key={item.title}
              width={proofCardWidth}
              icon={item.icon as IconName}
              badge={item.badge}
              title={item.title}
              text={item.text}
              highlights={item.highlights}
              outcome={item.outcome}
            />
          ))}
        </View>
      </SectionShell>

      <SectionShell tone="soft" onLayout={registerSection("faq")}>
        <SectionHeader
          kicker="FAQs"
          title="All Questions Answered"
          description="Everything a small business owner usually wants to know before getting started."
        />

        <View style={styles.faqStack}>
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <View key={item.question} style={styles.faqCard}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  style={({ pressed }) => [styles.faqTrigger, pressed && styles.pressed]}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "remove-circle-outline" : "add-circle-outline"}
                    size={22}
                    color={palette.darkWhatsappGreen}
                  />
                </Pressable>
                {isOpen ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
              </View>
            );
          })}
        </View>
      </SectionShell>

      <View style={styles.footerWrap}>
        <LinearGradient
          colors={["#0c2517", "#153f27"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.footerCard}
        >
          <Text style={styles.footerKicker}>Start Replying Faster With ShopKaBot</Text>
          <Text style={styles.footerTitle}>
            Train your AI chatbot with your business data and let it handle WhatsApp customer enquiries automatically.
          </Text>

          <View style={styles.footerBulletRow}>
            {footerBullets.map((item) => (
              <View key={item} style={styles.footerBulletChip}>
                <Text style={styles.footerBulletChipText}>{item}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton label="Get Instant Access" onPress={handlePrimaryCta} inverse />
          <Text style={styles.footerBrandCopy}>
            ShopKaBot - WhatsApp AI Chatbot for Businesses.
          </Text>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

type SectionShellProps = {
  children: ReactNode;
  tone?: "default" | "soft";
  onLayout?: (event: LayoutChangeEvent) => void;
};

function SectionShell({ children, tone = "default", onLayout }: SectionShellProps) {
  return (
    <View
      onLayout={onLayout}
      style={[styles.sectionShell, tone === "soft" && styles.sectionShellSoft]}
    >
      <View style={styles.maxWidth}>{children}</View>
    </View>
  );
}

function SectionHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionKicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function InfoCard({
  children,
  width,
  backgroundColor,
}: {
  children: ReactNode;
  width: string;
  backgroundColor?: string;
}) {
  return (
    <View style={[styles.infoCard, { width }, backgroundColor ? { backgroundColor } : null]}>
      {children}
    </View>
  );
}

function ProofCard({
  width,
  icon,
  badge,
  title,
  text,
  highlights,
  outcome,
}: {
  width: string;
  icon: IconName;
  badge: string;
  title: string;
  text: string;
  highlights: readonly string[];
  outcome: string;
}) {
  return (
    <View style={[styles.proofCard, { width }]}>
      <View style={styles.proofCardAccent} />

      <View style={styles.proofCardTopRow}>
        <View style={styles.proofIconBadge}>
          <Ionicons name={icon} size={20} color={palette.darkWhatsappGreen} />
        </View>
        <View style={styles.proofBadge}>
          <Text style={styles.proofBadgeText}>{badge}</Text>
        </View>
      </View>

      <Text style={styles.proofTitle}>{title}</Text>
      <Text style={styles.proofText}>{text}</Text>

      <View style={styles.proofHighlightWrap}>
        {highlights.map((item) => (
          <View key={`${title}-${item}`} style={styles.proofHighlightChip}>
            <Text style={styles.proofHighlightChipText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.proofOutcomeRow}>
        <Ionicons name="checkmark-circle" size={18} color={palette.primaryGreen} />
        <Text style={styles.proofOutcomeText}>{outcome}</Text>
      </View>
    </View>
  );
}

function ComparisonSection({
  isDesktop,
  onPrimaryCta,
  onDemoCta,
}: {
  isDesktop: boolean;
  onPrimaryCta: () => void;
  onDemoCta: () => void;
}) {
  return (
    <View style={styles.comparisonSectionWrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionKicker}>WHY SHOPKABOT</Text>
        <Text style={styles.sectionTitle}>More than a basic auto-reply tool</Text>
        <Text style={styles.sectionDescription}>
          Basic auto-reply tools send the same fixed message. ShopKaBot
          understands your business, remembers the conversation, and replies
          like a trained WhatsApp sales assistant.
        </Text>
      </View>

      <View style={[styles.comparisonGrid, isDesktop && styles.comparisonGridDesktop]}>
        <View style={styles.comparisonBasicCard}>
          <View style={styles.comparisonCardTopRow}>
            <Text style={styles.comparisonBasicTitle}>Basic Auto Reply</Text>
            <View style={styles.comparisonBasicBadge}>
              <Text style={styles.comparisonBasicBadgeText}>Fixed Message</Text>
            </View>
          </View>

          <View style={styles.comparisonChatStack}>
            <View style={styles.comparisonCustomerBubble}>
              <Text style={styles.comparisonBubbleLabel}>Customer</Text>
              <Text style={styles.comparisonCustomerText}>Catalog bhejo</Text>
            </View>

            <View style={styles.comparisonBasicReplyBubble}>
              <Text style={styles.comparisonBubbleLabel}>Reply</Text>
              <Text style={styles.comparisonBasicReplyText}>Please check our catalog.</Text>
            </View>
          </View>

          <View style={styles.comparisonList}>
            {basicLimitations.map((item) => (
              <View key={item} style={styles.comparisonListRow}>
                <Ionicons name="remove-circle-outline" size={18} color="#94a3b8" />
                <Text style={styles.comparisonListText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.comparisonAiCard}>
          <View style={styles.comparisonCardTopRow}>
            <Text style={styles.comparisonAiTitle}>ShopKaBot AI Chatbot</Text>
            <View style={styles.comparisonAiBadge}>
              <Text style={styles.comparisonAiBadgeText}>Smart AI Reply</Text>
            </View>
          </View>

          <View style={styles.comparisonChatStack}>
            <View style={styles.comparisonAiCustomerBubble}>
              <Text style={styles.comparisonAiBubbleLabel}>Customer</Text>
              <Text style={styles.comparisonAiCustomerText}>Catalog bhejo</Text>
            </View>

            <View style={styles.comparisonAiReplyBubble}>
              <Text style={styles.comparisonAiReplyText}>
                {"Sure \u{1F60A} I'm sharing our latest catalog PDF. Please check it and send screenshots of the products you like. I'll confirm price and availability."}
              </Text>
            </View>

            <View style={styles.comparisonMediaPill}>
              <Text style={styles.comparisonMediaPillText}>
                {"\u{1F4C4} Latest_Catalog.pdf sent"}
              </Text>
            </View>
          </View>

          <View style={styles.comparisonList}>
            {aiBenefits.map((item) => (
              <View key={item} style={styles.comparisonListRow}>
                <Ionicons name="checkmark-circle" size={18} color="#86efac" />
                <Text style={styles.comparisonAiListText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.comparisonCtaCard}>
        <Text style={styles.comparisonCtaTitle}>Ready to upgrade your WhatsApp replies?</Text>
        <Text style={styles.comparisonCtaText}>
          Start with ShopKaBot at just \u20B9999/month and let AI handle repeated
          customer enquiries.
        </Text>

        <View style={styles.comparisonCtaButtons}>
          <PrimaryButton label="Get Instant Access" onPress={onPrimaryCta} />
          <SecondaryButton
            label="View Demo"
            onPress={onDemoCta}
            icon="play-circle-outline"
          />
        </View>

        <Text style={styles.comparisonCtaTrust}>
          Setup support included • Secure payment • No technical knowledge needed
        </Text>
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  compact,
  inverse,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        inverse && styles.primaryButtonInverse,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          inverse && styles.primaryButtonTextInverse,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
    >
      {icon ? <Ionicons name={icon} size={18} color="#14532d" /> : null}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f6fbf7",
  },
  pageContent: {
    paddingBottom: 40,
  },
  maxWidth: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  offerBar: {
    backgroundColor: "#0d2c1c",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  offerBarInner: {
    minHeight: 48,
    paddingVertical: 10,
    gap: 10,
    alignItems: "center",
  },
  offerBarInnerDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offerBarMeta: {
    alignItems: "center",
    gap: 8,
  },
  offerBarActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  offerBarCopy: {
    color: "#ffffff",
    fontFamily: typography.bold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  offerTimerWrap: {
    alignItems: "center",
    gap: 8,
  },
  offerTimerLabel: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: typography.medium,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  offerTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  offerTimerChip: {
    minWidth: 54,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    gap: 2,
  },
  offerTimerValue: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 16,
    lineHeight: 18,
  },
  offerTimerUnit: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  heroWrap: {
    paddingTop: 12,
    paddingBottom: 44,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingVertical: 12,
    gap: 12,
  },
  headerDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 16,
  },
  brandName: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  brandTagline: {
    color: "#426453",
    fontFamily: typography.medium,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerLinkText: {
    color: "#19412b",
    fontFamily: typography.semibold,
    fontSize: 14,
  },
  heroSection: {
    marginTop: 20,
    paddingTop: 32,
    gap: 32,
  },
  heroSectionDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCopyColumn: {
    flex: 1,
    gap: 16,
  },
  heroVisualColumn: {
    flex: 1,
    alignItems: "center",
  },
  heroVisualStack: {
    width: "100%",
    maxWidth: 520,
    gap: 16,
  },
  eyebrowPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#dff7e7",
  },
  eyebrowPillText: {
    color: "#18472f",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  heroTitle: {
    color: "#081b0f",
    fontFamily: typography.extrabold,
    fontSize: 48,
    lineHeight: 54,
    maxWidth: 560,
  },
  heroDescription: {
    color: "#526373",
    fontFamily: typography.regular,
    fontSize: 18,
    lineHeight: 29,
    maxWidth: 600,
  },
  heroPricingLine: {
    color: "#0f172a",
    fontFamily: typography.bold,
    fontSize: 16,
  },
  heroButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroTrustLine: {
    color: "#64748b",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  heroBulletStack: {
    gap: 10,
    marginTop: 2,
  },
  heroBulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroBulletText: {
    color: "#334155",
    fontFamily: typography.medium,
    fontSize: 14,
  },
  salesPhoneShell: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 8,
    borderColor: "#ffffff",
    shadowColor: "#4c1d95",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  salesChatHeader: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  salesChatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  salesChatAvatarText: {
    color: "#075E54",
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  salesChatHeaderTextBlock: {
    flex: 1,
  },
  salesChatHeaderTitle: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 17,
  },
  salesChatHeaderSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: 2,
  },
  salesChatStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  salesChatStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#25D366",
  },
  salesChatStatusText: {
    color: "#ffffff",
    fontFamily: typography.bold,
    fontSize: 11,
  },
  salesChatBody: {
    minHeight: 390,
    padding: 16,
    backgroundColor: "#E8DED2",
    gap: 12,
  },
  salesChatBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  salesChatBubbleCustomer: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 6,
  },
  salesChatBubbleBot: {
    alignSelf: "flex-end",
    backgroundColor: "#d9f99d",
    borderTopRightRadius: 6,
  },
  salesChatBubbleText: {
    color: "#0f172a",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  salesChatBubbleTextBot: {
    color: "#14532d",
  },
  salesChatBubbleTime: {
    marginTop: 6,
    alignSelf: "flex-end",
    color: "#64748b",
    fontFamily: typography.medium,
    fontSize: 10,
  },
  salesTypingBubble: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopRightRadius: 6,
    backgroundColor: "#d9f99d",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  salesTypingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#64748b",
  },
  salesChatFooter: {
    minHeight: 56,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  salesChatFooterText: {
    color: "#475569",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  trustedBusinessesCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  trustedBusinessesTitle: {
    color: "#ffffff",
    fontFamily: typography.bold,
    fontSize: 16,
    marginBottom: 12,
  },
  trustedBusinessesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  trustedBusinessChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  trustedBusinessChipText: {
    color: "#ffffff",
    fontFamily: typography.medium,
    fontSize: 12,
  },
  sectionShell: {
    paddingVertical: 52,
    backgroundColor: "#f6fbf7",
  },
  sectionShellSoft: {
    backgroundColor: "#eef8f1",
  },
  sectionHeader: {
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  sectionKicker: {
    color: "#1a7a4b",
    fontFamily: typography.bold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#081b0f",
    fontFamily: typography.extrabold,
    fontSize: 34,
    lineHeight: 42,
    textAlign: "center",
    maxWidth: 760,
  },
  sectionDescription: {
    color: "#4a6758",
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 760,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
    shadowColor: "#0f5132",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 12,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dff7e7",
  },
  infoCardTitle: {
    color: "#092313",
    fontFamily: typography.bold,
    fontSize: 18,
  },
  infoCardBody: {
    color: "#4d695a",
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    padding: 24,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
    alignItems: "center",
    gap: 8,
  },
  statCardDesktop: {
    flex: 1,
    minWidth: 0,
  },
  statCardTablet: {
    width: "48.8%",
  },
  statCardMobile: {
    width: "100%",
  },
  statValue: {
    color: "#0d5a34",
    fontFamily: typography.extrabold,
    fontSize: 28,
  },
  statLabel: {
    color: "#4b6658",
    fontFamily: typography.medium,
    fontSize: 15,
    textAlign: "center",
  },
  stepLabel: {
    color: "#1f8f57",
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stepTitle: {
    color: "#092313",
    fontFamily: typography.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  stepDescription: {
    color: "#4d695a",
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  comparisonSectionWrap: {
    gap: 28,
  },
  comparisonGrid: {
    gap: 16,
  },
  comparisonGridDesktop: {
    flexDirection: "row",
  },
  comparisonBasicCard: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 24,
    gap: 18,
    shadowColor: "#0f5132",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  comparisonAiCard: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#86efac",
    backgroundColor: "#0f5132",
    padding: 24,
    gap: 18,
    shadowColor: "#14532d",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  comparisonCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  comparisonBasicTitle: {
    color: "#0f172a",
    fontFamily: typography.bold,
    fontSize: 22,
  },
  comparisonAiTitle: {
    color: "#ffffff",
    fontFamily: typography.bold,
    fontSize: 22,
  },
  comparisonBasicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  comparisonBasicBadgeText: {
    color: "#64748b",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  comparisonAiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(134,239,172,0.18)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.32)",
  },
  comparisonAiBadgeText: {
    color: "#dcfce7",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  comparisonChatStack: {
    gap: 12,
  },
  comparisonCustomerBubble: {
    alignSelf: "flex-start",
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f1f5f9",
  },
  comparisonAiCustomerBubble: {
    alignSelf: "flex-start",
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  comparisonBubbleLabel: {
    color: "#64748b",
    fontFamily: typography.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  comparisonAiBubbleLabel: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  comparisonCustomerText: {
    color: "#1f2937",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  comparisonAiCustomerText: {
    color: "#ffffff",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  comparisonBasicReplyBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  comparisonBasicReplyText: {
    color: "#475569",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  comparisonAiReplyBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  comparisonAiReplyText: {
    color: "#0f172a",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  comparisonMediaPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#dcfce7",
  },
  comparisonMediaPillText: {
    color: "#14532d",
    fontFamily: typography.bold,
    fontSize: 13,
  },
  comparisonList: {
    gap: 10,
  },
  comparisonListRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  comparisonListText: {
    flex: 1,
    color: "#64748b",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  comparisonAiListText: {
    flex: 1,
    color: "rgba(255,255,255,0.92)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  comparisonCtaCard: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcfce7",
    alignItems: "center",
    gap: 14,
  },
  comparisonCtaTitle: {
    color: "#0f172a",
    fontFamily: typography.bold,
    fontSize: 24,
    textAlign: "center",
  },
  comparisonCtaText: {
    color: "#526373",
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 680,
  },
  comparisonCtaButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
  },
  comparisonCtaTrust: {
    color: "#64748b",
    fontFamily: typography.medium,
    fontSize: 13,
    textAlign: "center",
  },
  demoLabel: {
    color: "#1f8f57",
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  demoBubbleCustomer: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#edf7ef",
  },
  demoBubbleCustomerText: {
    color: "#16412d",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  demoBubbleBot: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2eee5",
  },
  demoBubbleBotText: {
    color: "#3f5d4d",
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  demoMediaChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#dff7e7",
  },
  demoMediaChipText: {
    color: "#0f5132",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  ctaBlockStack: {
    gap: 18,
  },
  ctaBlock: {
    borderRadius: 32,
    padding: 26,
    gap: 20,
  },
  ctaBlockLight: {
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
  },
  ctaCopy: {
    gap: 12,
  },
  ctaTitle: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 28,
    lineHeight: 36,
  },
  ctaTitleLight: {
    color: "#092313",
  },
  ctaDescription: {
    color: "rgba(255,255,255,0.84)",
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 760,
  },
  ctaDescriptionLight: {
    color: "#486558",
  },
  ctaBulletRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ctaBulletChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  ctaBulletChipLight: {
    backgroundColor: "#ffffff",
  },
  ctaBulletChipText: {
    color: "#ffffff",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  ctaBulletChipTextLight: {
    color: "#18442f",
  },
  ctaAction: {
    alignSelf: "flex-start",
  },
  pricingCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 780,
    padding: 28,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
    shadowColor: "#0f5132",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
    gap: 16,
  },
  pricingBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#dff7e7",
  },
  pricingBadgeText: {
    color: "#0f5132",
    fontFamily: typography.bold,
    fontSize: 13,
  },
  pricingAmount: {
    color: "#092313",
    fontFamily: typography.extrabold,
    fontSize: 42,
  },
  pricingSubtitle: {
    color: "#4c6859",
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  pricingFeatureList: {
    gap: 12,
    marginVertical: 4,
  },
  pricingFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pricingFeatureText: {
    flex: 1,
    color: "#214b35",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  pricingNote: {
    color: "#5d786a",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  proofCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
    shadowColor: "#0f5132",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 14,
  },
  proofCardAccent: {
    width: 64,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#25D366",
  },
  proofCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  proofIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dff7e7",
  },
  proofBadge: {
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "rgba(37, 211, 102, 0.22)",
  },
  proofBadgeText: {
    color: "#166534",
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  proofTitle: {
    color: "#092313",
    fontFamily: typography.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  proofText: {
    color: "#486558",
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  proofHighlightWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  proofHighlightChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f6fbf7",
  },
  proofHighlightChipText: {
    color: "#1b4332",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  proofOutcomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 2,
  },
  proofOutcomeText: {
    flex: 1,
    color: "#214b35",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  faqStack: {
    gap: 14,
  },
  faqCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
  },
  faqTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  faqQuestion: {
    flex: 1,
    color: "#092313",
    fontFamily: typography.bold,
    fontSize: 17,
    lineHeight: 24,
  },
  faqAnswer: {
    marginTop: 14,
    color: "#4a6758",
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  footerWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerCard: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    padding: 30,
    borderRadius: 34,
    gap: 16,
  },
  footerKicker: {
    color: "#9ae6b4",
    fontFamily: typography.bold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  footerTitle: {
    color: "#ffffff",
    fontFamily: typography.extrabold,
    fontSize: 32,
    lineHeight: 42,
    maxWidth: 820,
  },
  footerBulletRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  footerBulletChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  footerBulletChipText: {
    color: "#ffffff",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  footerBrandCopy: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 54,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  primaryButtonCompact: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryButtonInverse: {
    backgroundColor: "#ffffff",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: typography.bold,
    fontSize: 15,
  },
  primaryButtonTextInverse: {
    color: "#0f5132",
  },
  secondaryButton: {
    minHeight: 54,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.18)",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#18442f",
    fontFamily: typography.bold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.92,
  },
});


