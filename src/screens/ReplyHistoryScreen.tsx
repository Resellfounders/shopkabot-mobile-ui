import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PageScaffold } from "../components/PageScaffold";
import { RuleEditorModal } from "../components/RuleEditorModal";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  createAutoReplyMessage,
  listChatConversationSummaries,
} from "../services/api";
import {
  AutoReplyMessagePayload,
  ChatHistoryMessage,
  TrainingDraft,
} from "../types/autoReply";
import { palette, typography } from "../theme/palette";

const CHAT_HISTORY_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "";

type ReplyHistoryFilter = "all" | "replied" | "not_replied";

const FILTER_OPTIONS: Array<{
  value: ReplyHistoryFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "replied", label: "AI Replied" },
  { value: "not_replied", label: "Not Replied" },
];

function buildTrainingDraft(
  summary: ChatHistoryMessage,
): TrainingDraft | null {
  const incoming = summary.content?.trim();
  if (!incoming) {
    return null;
  }

  const reply = summary.replyContent?.trim() || "";
  return {
    incomingMessage: [incoming],
    replyMessage: [reply],
    rule: reply ? "smart_intent_match" : "smart_intent",
    sourceLabel: `Reply history from ${summary.fromPhoneNumber}`,
  };
}

export function ReplyHistoryScreen() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingHistoryId, setTrainingHistoryId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReplyHistoryFilter>("all");
  const [editorVisible, setEditorVisible] = useState(false);
  const [initialDraft, setInitialDraft] = useState<TrainingDraft | null>(null);

  const businessId = useMemo(
    () => settings.businessId.trim() || null,
    [settings.businessId],
  );

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const hasReply = Boolean(item.replyContent?.trim());
      if (activeFilter === "replied") {
        return hasReply;
      }
      if (activeFilter === "not_replied") {
        return !hasReply;
      }
      return true;
    });
  }, [activeFilter, history]);

  const loadHistory = useCallback(
    async (isRefresh = false) => {
      if (!CHAT_HISTORY_BASE_URL) {
        setError(
          "Set EXPO_PUBLIC_API_BASE_URL to load auto-reply history.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!businessId) {
        setHistory([]);
        setError(
          "Connect WhatsApp Business first so auto-reply history can be linked to a businessId.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await listChatConversationSummaries({
          baseUrl: CHAT_HISTORY_BASE_URL,
          businessId,
        });
        setHistory(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load reply history.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [businessId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const handleUseForTraining = useCallback(
    async (summary: ChatHistoryMessage) => {
      if (!settings.apiBaseUrl) {
        Alert.alert(
          "Reply history unavailable",
          "Set the API base URL first.",
        );
        return;
      }

      if (!businessId) {
        Alert.alert(
          "WhatsApp Business required",
          "Onboard WhatsApp Business first so auto-reply history is linked to a businessId.",
        );
        return;
      }

      setTrainingHistoryId(summary.id);
      try {
        const draft = buildTrainingDraft(summary);
        if (!draft) {
          Alert.alert(
            "No usable message found",
            "This history row does not contain a customer message that can be used for training yet.",
          );
          return;
        }

        setInitialDraft(draft);
        setEditorVisible(true);
      } catch (trainError) {
        Alert.alert(
          "Unable to prepare training",
          trainError instanceof Error
            ? trainError.message
            : "Please try again.",
        );
      } finally {
        setTrainingHistoryId(null);
      }
    },
    [businessId, settings.apiBaseUrl],
  );

  const closeEditor = useCallback(() => {
    setEditorVisible(false);
    setInitialDraft(null);
  }, []);

  const handleSaveTraining = useCallback(
    async (payload: AutoReplyMessagePayload) => {
      if (!settings.apiBaseUrl || !user?.email) {
        throw new Error("Missing account or API settings.");
      }

      await createAutoReplyMessage({
        baseUrl: settings.apiBaseUrl,
        payload,
      });

      Alert.alert(
        "Added to training",
        "This reply history example has been saved to training.",
      );
    },
    [settings.apiBaseUrl, user?.email],
  );

  return (
    <PageScaffold
      title="Reply History"
      subtitle="Use past conversations to create new training examples."
    >
      <SectionCard title="Conversation History">
        <View style={styles.filterBar}>
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={palette.primaryGreen} />
            <Text style={styles.helperText}>Loading auto-reply history...</Text>
          </View>
        ) : error ? (
          <View style={styles.noticeCard}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={palette.warning}
            />
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadHistory(true)}
                tintColor={palette.primaryGreen}
              />
            }
          >
            {filteredHistory.length ? (
              filteredHistory.map((item) => {
                const isPreparing = trainingHistoryId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={styles.historyCard}
                    onPress={() => void handleUseForTraining(item)}
                  >
                    <View style={styles.historyHeader}>
                      <View style={styles.historyIcon}>
                        <Ionicons
                          name="chatbox-ellipses-outline"
                          size={18}
                          color={palette.primaryGreen}
                        />
                      </View>
                      <View style={styles.historyCopy}>
                        <Text style={styles.historyLabel}>Customer</Text>
                        <Text style={styles.historyPhone}>
                          {item.fromPhoneNumber}
                        </Text>
                      </View>
                      <View style={styles.historyAction}>
                        {isPreparing ? (
                          <ActivityIndicator
                            size="small"
                            color={palette.primaryGreen}
                          />
                        ) : (
                          <>
                            <Text style={styles.historyActionText}>
                              Use for training
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={16}
                              color={palette.primaryGreen}
                            />
                          </>
                        )}
                      </View>
                    </View>

                    <Text style={styles.historyPreview} numberOfLines={3}>
                      {item.content?.trim() || "No preview available"}
                    </Text>

                    <View style={styles.replyBlock}>
                      <Text style={styles.replyLabel}>Reply</Text>
                      <Text style={styles.replyPreview} numberOfLines={3}>
                        {item.replyContent?.trim() ||
                          "No AI reply was sent for this message yet."}
                      </Text>
                    </View>

                    <Text style={styles.historyHint}>
                      Tap to pull this exact history row into Train The Bot.
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color="rgba(255,255,255,0.64)"
                />
                <Text style={styles.emptyTitle}>Nothing to show yet</Text>
                <Text style={styles.emptyText}>
                  {activeFilter === "all"
                    ? "Once auto-reply attempts are stored, they will appear here for training."
                    : activeFilter === "replied"
                      ? "No messages with AI replies match this filter yet."
                      : "No pending or non-replied messages match this filter yet."}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SectionCard>

      <RuleEditorModal
        visible={editorVisible}
        editingRule={null}
        initialDraft={initialDraft}
        gmailId={user?.email || ""}
        businessId={businessId}
        apiBaseUrl={settings.apiBaseUrl}
        onClose={closeEditor}
        onSubmit={handleSaveTraining}
      />
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 640,
  },
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  centerState: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  helperText: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.medium,
    fontSize: 14,
  },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    borderColor: "rgba(37,211,102,0.34)",
    backgroundColor: "rgba(37,211,102,0.14)",
  },
  filterChipText: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: palette.primaryGreen,
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    backgroundColor: "rgba(245,158,11,0.08)",
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  noticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.84)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  historyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    padding: 16,
    gap: 12,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(37,211,102,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyLabel: {
    color: "rgba(255,255,255,0.52)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  historyPhone: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  historyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyActionText: {
    color: palette.primaryGreen,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  historyPreview: {
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  replyBlock: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    gap: 6,
  },
  replyLabel: {
    color: "rgba(255,255,255,0.52)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  replyPreview: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  historyHint: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 8,
  },
  emptyTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  emptyText: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
