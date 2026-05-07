import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import { SectionCard } from "../components/SectionCard";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  getChatConversationMessages,
  listChatConversationSummaries,
} from "../services/api";
import { ChatHistoryMessage, TrainingDraft } from "../types/autoReply";
import { palette, typography } from "../theme/palette";

const CHAT_HISTORY_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "";

function normalizeRole(role: string | null | undefined) {
  return (role || "").toLowerCase();
}

function buildTrainingDraft(
  messages: ChatHistoryMessage[],
  customerPhoneNumber: string,
): TrainingDraft | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const current = messages[index];
    if (normalizeRole(current.role) !== "assistant") {
      continue;
    }

    for (
      let previousIndex = index - 1;
      previousIndex >= 0;
      previousIndex -= 1
    ) {
      const previous = messages[previousIndex];
      if (normalizeRole(previous.role) !== "user") {
        continue;
      }

      const incoming = previous.content?.trim();
      const reply = current.content?.trim();
      if (!incoming || !reply) {
        continue;
      }

      return {
        incomingMessage: [incoming],
        replyMessage: [reply],
        rule: "smart_intent_match",
        sourceLabel: `Reply history from ${customerPhoneNumber}`,
      };
    }
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const current = messages[index];
    if (normalizeRole(current.role) !== "user") {
      continue;
    }

    const incoming = current.content?.trim();
    if (!incoming) {
      continue;
    }

    return {
      incomingMessage: [incoming],
      replyMessage: [""],
      rule: "smart_intent",
      sourceLabel: `Reply history from ${customerPhoneNumber}`,
    };
  }

  return null;
}

export function ReplyHistoryScreen() {
  const navigation = useNavigation<any>();
  const { settings } = useAppSettings();
  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingCustomer, setTrainingCustomer] = useState<string | null>(null);

  const businessId = useMemo(
    () => settings.businessId.trim() || null,
    [settings.businessId],
  );

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
      if (!CHAT_HISTORY_BASE_URL) {
        Alert.alert(
          "Reply history unavailable",
          "Set EXPO_PUBLIC_API_BASE_URL first.",
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

      setTrainingCustomer(summary.fromPhoneNumber);
      try {
        const messages = await getChatConversationMessages({
          baseUrl: CHAT_HISTORY_BASE_URL,
          businessId,
          customerPhoneNumber: summary.fromPhoneNumber,
        });

        const draft = buildTrainingDraft(messages, summary.fromPhoneNumber);
        if (!draft) {
          Alert.alert(
            "No usable message found",
            "This conversation does not contain a customer message that can be used for training yet.",
          );
          return;
        }

        navigation.navigate("Rules", {
          prefillTraining: draft,
        });
      } catch (trainError) {
        Alert.alert(
          "Unable to prepare training",
          trainError instanceof Error
            ? trainError.message
            : "Please try again.",
        );
      } finally {
        setTrainingCustomer(null);
      }
    },
    [businessId, navigation],
  );

  return (
    <PageScaffold
      title="Reply History"
      subtitle="Use past conversations to create new training examples."
    >
      <SectionCard title="Conversation History">
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
            {history.length ? (
              history.map((item) => {
                const isPreparing = trainingCustomer === item.fromPhoneNumber;
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

                    <Text style={styles.historyHint}>
                      Tap to pull the latest customer + bot exchange into Train
                      The Bot.
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
                  Once auto-reply attempts are stored, they will appear here for
                  training.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SectionCard>
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
