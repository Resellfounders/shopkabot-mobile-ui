import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { MetricCard } from "../components/MetricCard";
import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useUserSettingsBusiness } from "../hooks/useUserSettingsBusiness";
import { listAutoReplyMessages } from "../services/api";
import { AutoReplyMessage } from "../types/autoReply";
import { formatRelativeDate } from "../utils/format";
import { palette, typography } from "../theme/palette";

export function DashboardScreen() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { resolvedBusinessId } = useUserSettingsBusiness();
  const [rules, setRules] = useState<AutoReplyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await listAutoReplyMessages({
        baseUrl: settings.apiBaseUrl,
        gmailId: user.email,
        businessId: resolvedBusinessId || undefined,
      });
      setRules(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load rules.");
    } finally {
      setLoading(false);
    }
  }, [resolvedBusinessId, settings.apiBaseUrl, user?.email]);

  useFocusEffect(
    useCallback(() => {
      void loadRules();
    }, [loadRules]),
  );

  const summary = useMemo(() => {
    const totalTriggers = rules.reduce(
      (count, rule) => count + rule.incomingMessage.length,
      0,
    );
    const totalReplies = rules.reduce(
      (count, rule) => count + rule.replyMessage.length,
      0,
    );

    return {
      totalRules: rules.length,
      totalTriggers,
      totalReplies,
      latestRule: rules[0],
    };
  }, [rules]);

  return (
    <PageScaffold
      title="Dashboard"
      subtitle="See your training at a glance."
    >
      <View style={styles.metricRow}>
        <MetricCard label="Training examples" value={String(summary.totalRules)} tone="green" />
        <MetricCard label="Customer questions taught" value={String(summary.totalTriggers)} tone="teal" />
        <MetricCard label="AI replies taught" value={String(summary.totalReplies)} tone="amber" />
      </View>

      <SectionCard title="Workspace">
        {loading ? (
          <ActivityIndicator color={palette.primaryGreen} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.snapshotStack}>
            <View style={styles.snapshotCard}>
              <Text style={styles.snapshotLabel}>Training account</Text>
              <Text style={styles.snapshotValue}>{user?.email || "Unknown"}</Text>
            </View>
            <View style={styles.snapshotCard}>
              <Text style={styles.snapshotLabel}>Training workspace</Text>
              <Text style={styles.snapshotValue}>
                {resolvedBusinessId || "No business selected yet"}
              </Text>
            </View>
            <View style={styles.snapshotCard}>
              <Text style={styles.snapshotLabel}>Last training update</Text>
              <Text style={styles.snapshotValue}>
                {summary.latestRule
                  ? formatRelativeDate(summary.latestRule.updatedAt)
                  : "No training added yet"}
              </Text>
            </View>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Quick Tips">
        {[
          "Teach pricing, timings, and delivery first.",
          "Add a few real message variations for each rule.",
          "Keep replies short and in your brand tone.",
        ].map((item) => (
          <View key={item} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{item}</Text>
          </View>
        ))}
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  snapshotStack: {
    gap: 10,
  },
  snapshotCard: {
    borderRadius: 16,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    padding: 12,
    gap: 4,
  },
  snapshotLabel: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  snapshotValue: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.primaryGreen,
  },
  tipText: {
    flex: 1,
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    color: palette.warning,
    fontFamily: typography.semibold,
    fontSize: 14,
  },
});

