import { StyleSheet, Text, View } from "react-native";

import { palette, typography } from "../theme/palette";

type MetricCardProps = {
  label: string;
  value: string;
  tone?: "green" | "teal" | "amber";
};

const toneMap = {
  green: "rgba(37, 211, 102, 0.16)",
  teal: "rgba(0, 194, 168, 0.16)",
  amber: "rgba(245, 158, 11, 0.16)",
};

export function MetricCard({
  label,
  value,
  tone = "green",
}: MetricCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: toneMap[tone] }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  value: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 24,
  },
  label: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.medium,
    fontSize: 14,
  },
});

