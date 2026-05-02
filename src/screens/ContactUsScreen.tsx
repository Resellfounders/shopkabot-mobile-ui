import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { palette, typography } from "../theme/palette";

const contactConfig = {
  email: process.env.EXPO_PUBLIC_CONTACT_EMAIL || "",
  phone: process.env.EXPO_PUBLIC_CONTACT_PHONE || "",
  whatsappUrl: process.env.EXPO_PUBLIC_CONTACT_WHATSAPP_URL || "",
  bookingUrl: process.env.EXPO_PUBLIC_CONTACT_BOOKING_URL || "",
};

async function openLink(url: string, fallbackMessage: string) {
  if (!url) {
    Alert.alert("Contact detail missing", fallbackMessage);
    return;
  }

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("Unable to open link", url);
    return;
  }

  await Linking.openURL(url);
}

export function ContactUsScreen() {
  return (
    <PageScaffold title="Contact Us" subtitle="Support, sales, and setup help.">
      <SectionCard title="Get Support">
        <View style={styles.actionGrid}>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              void openLink(
                contactConfig.whatsappUrl,
                "Set EXPO_PUBLIC_CONTACT_WHATSAPP_URL to enable WhatsApp contact.",
              )
            }
          >
            <Text style={styles.primaryButtonText}>Chat on WhatsApp</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              void openLink(
                contactConfig.bookingUrl,
                "Set EXPO_PUBLIC_CONTACT_BOOKING_URL to enable demo booking.",
              )
            }
          >
            <Text style={styles.secondaryButtonText}>Book a Demo</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            {contactConfig.email || "Set EXPO_PUBLIC_CONTACT_EMAIL"}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>
            {contactConfig.phone || "Set EXPO_PUBLIC_CONTACT_PHONE"}
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="Enterprise">
        {[
          "Custom automation and integrations",
          "Advanced AI workflows across tools",
          "Implementation support for larger teams",
        ].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minWidth: 160,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: palette.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 160,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 16,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  infoValue: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.primaryGreen,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
});
