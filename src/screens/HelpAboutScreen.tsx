import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { palette, typography } from "../theme/palette";

const FALLBACK_SUPPORT_WHATSAPP_NUMBER = "+91 97682 60471";
const FALLBACK_SUPPORT_WHATSAPP_URL =
  "https://wa.me/919768260471?text=" +
  encodeURIComponent(
    "Hi, I need help with my ShopKaBot setup, subscription, or WhatsApp automation.",
  );
const SUPPORT_WHATSAPP_NUMBER =
  process.env.EXPO_PUBLIC_CONTACT_WHATSAPP_NUMBER ||
  FALLBACK_SUPPORT_WHATSAPP_NUMBER;
const SUPPORT_WHATSAPP_URL =
  process.env.EXPO_PUBLIC_CONTACT_WHATSAPP_URL || FALLBACK_SUPPORT_WHATSAPP_URL;

const faqItems = [
  {
    question: "The bot is not replying to customer messages. What should I check?",
    answer:
      "First confirm your subscription is active, then finish Connect WhatsApp onboarding. If the bot is still quiet, make sure AI replies are enabled for this business and the customer number is not added in Disable AI Reply.",
  },
  {
    question: "How do I train the bot with my business information?",
    answer:
      "Open Train The Bot and save clear reply rules for pricing, delivery, offers, timings, and common customer questions. The more specific your rules are, the better the bot can answer in your business tone.",
  },
  {
    question: "The bot is giving incomplete or wrong answers. How can I improve it?",
    answer:
      "Update your saved rules with exact product details, service steps, and preferred wording. Avoid vague instructions and add examples for the questions customers ask most often.",
  },
  {
    question: "Can I stop AI replies for one specific customer?",
    answer:
      "Yes. Use Disable AI Reply and add that customer's WhatsApp number. ShopKaBot will block automatic AI replies for that number inside your connected business workspace.",
  },
  {
    question: "I paid for a plan but the app still does not show it. What should I do?",
    answer:
      "Go to Subscription and tap Refresh Status. Payment webhooks can take a little time to sync. If the plan still does not appear after a short wait, contact support on WhatsApp with your payment details.",
  },
  {
    question: "Why does Connect WhatsApp ask me to continue on the web app?",
    answer:
      "ShopKaBot now supports Meta embedded signup on both Android and the web app. If the flow does not open, check that the Meta app ID and config ID are configured correctly, then try the connection again.",
  },
] as const;

async function openWhatsAppSupport() {
  const supported = await Linking.canOpenURL(SUPPORT_WHATSAPP_URL);

  if (!supported) {
    Alert.alert(
      "Unable to open WhatsApp",
      `Please message us on ${SUPPORT_WHATSAPP_NUMBER}.`,
    );
    return;
  }

  await Linking.openURL(SUPPORT_WHATSAPP_URL);
}

export function HelpAboutScreen() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <PageScaffold
      title="Help / About"
      subtitle="Quick help and support."
    >
      <SectionCard title="About ShopKaBot">
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>
            ShopKaBot helps you automate WhatsApp Business replies.
          </Text>
          <Text style={styles.aboutText}>
            Train replies, connect WhatsApp, manage access, and control where AI should respond.
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="FAQs">
        <View style={styles.faqList}>
          {faqItems.map((item, index) => (
            <Pressable
              key={item.question}
              style={styles.faqCard}
              onPress={() =>
                setOpenFaqIndex((currentIndex) =>
                  currentIndex === index ? null : index,
                )
              }
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqHeaderContent}>
                  <View style={styles.faqIndex}>
                    <Text style={styles.faqIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                </View>
                <Ionicons
                  name={
                    openFaqIndex === index
                      ? "chevron-up-outline"
                      : "chevron-down-outline"
                  }
                  size={20}
                  color="rgba(255,255,255,0.72)"
                />
              </View>
              {openFaqIndex === index ? (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Need Support?">
        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <View style={styles.supportIconWrap}>
              <Ionicons
                name="logo-whatsapp"
                size={22}
                color={palette.textDark}
              />
            </View>
            <View style={styles.supportCopy}>
              <Text style={styles.supportTitle}>Talk to support</Text>
              <Text style={styles.supportText}>
                Share your issue, screenshot, payment status, or onboarding
                problem and the team can guide you faster.
              </Text>
            </View>
          </View>

          <View style={styles.supportNumberCard}>
            <Text style={styles.supportNumberLabel}>WhatsApp Support Number</Text>
            <Text style={styles.supportNumberValue}>
              {SUPPORT_WHATSAPP_NUMBER}
            </Text>
          </View>

          <Pressable
            style={styles.supportButton}
            onPress={() => void openWhatsAppSupport()}
          >
            <Ionicons
              name="arrow-forward-circle-outline"
              size={18}
              color={palette.textDark}
            />
            <Text style={styles.supportButtonText}>Chat on WhatsApp</Text>
          </Pressable>
        </View>
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  aboutCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(0,194,168,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,194,168,0.2)",
    gap: 10,
  },
  aboutTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 18,
    lineHeight: 26,
  },
  aboutText: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 10,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  faqHeaderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  faqIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,211,102,0.12)",
  },
  faqIndexText: {
    color: palette.primaryGreen,
    fontFamily: typography.extrabold,
    fontSize: 12,
  },
  faqQuestion: {
    flex: 1,
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  faqAnswer: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  supportCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(37,211,102,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.18)",
    gap: 14,
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  supportIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  supportCopy: {
    flex: 1,
    gap: 4,
  },
  supportTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 18,
  },
  supportText: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  supportNumberCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: palette.cardBackground,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 6,
  },
  supportNumberLabel: {
    color: "rgba(255,255,255,0.56)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  supportNumberValue: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  supportButton: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: palette.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  supportButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
});

