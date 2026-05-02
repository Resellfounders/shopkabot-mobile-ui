import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette, typography, typeScale } from "../theme/palette";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 12,
  },
  header: {
    gap: 4,
  },
  title: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 18,
  },
  subtitle: {
    color: "rgba(255,255,255,0.66)",
    fontFamily: typography.medium,
    fontSize: typeScale.bodySecondary,
    lineHeight: 22,
  },
});

