import { Pressable, StyleSheet, Text, View } from "react-native";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { palette, typography } from "../theme/palette";

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  primaryNote: string;
};

export function PlaceholderScreen({
  title,
  subtitle,
  primaryNote,
}: PlaceholderScreenProps) {
  return (
    <PageScaffold title={title} subtitle={subtitle}>
      <SectionCard
        title="Designed for the next step"
        subtitle="This section is already included in navigation so the app feels complete from day one."
      >
        <View style={styles.placeholderBlock}>
          <Text style={styles.primaryNote}>{primaryNote}</Text>
          <Text style={styles.secondaryNote}>
            When you want, we can wire this page to real backend services next.
          </Text>
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Plan this section</Text>
          </Pressable>
        </View>
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  placeholderBlock: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 10,
  },
  primaryNote: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  secondaryNote: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  ctaButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(37,211,102,0.12)",
  },
  ctaButtonText: {
    color: palette.primaryGreen,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
});

