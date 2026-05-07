import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { getBusinessReplyConfig, testAutoReplyMessage } from "../services/api";
import {
  AutoReplyAttachment,
  AutoReplyMessageTestResult,
  BusinessReplyConfig,
} from "../types/autoReply";
import { palette, typography, typeScale } from "../theme/palette";

type ChatBubble = {
  id: string;
  role: "user" | "bot";
  text: string;
  meta?: string[];
  variant?: "success" | "muted";
  attachments?: AutoReplyAttachment[];
};

function formatAttachmentSize(sizeBytes?: number | null) {
  if (!sizeBytes || sizeBytes <= 0) {
    return null;
  }

  const sizeInMb = sizeBytes / (1024 * 1024);
  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(sizeInMb >= 10 ? 0 : 1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function AttachmentDetailsList({
  attachments,
}: {
  attachments: AutoReplyAttachment[];
}) {
  if (!attachments.length) {
    return null;
  }

  return (
    <View style={styles.attachmentList}>
      {attachments.map((attachment, index) => {
        const label =
          attachment.filename ||
          attachment.caption ||
          `${attachment.type === "image" ? "Image" : "Document"} ${index + 1}`;
        const detailParts = [
          attachment.type === "image" ? "Image" : "PDF",
          attachment.mimeType || null,
          formatAttachmentSize(attachment.sizeBytes),
        ].filter(Boolean);

        return (
          <View
            key={`${attachment.url}-${index}`}
            style={styles.attachmentCardDocument}
          >
            <View style={styles.attachmentDocumentIcon}>
              <Ionicons
                name={
                  attachment.type === "image"
                    ? "image-outline"
                    : "document-text-outline"
                }
                size={20}
                color={palette.primaryGreen}
              />
            </View>
            <View style={styles.attachmentCopy}>
              <Text style={styles.attachmentTitle} numberOfLines={1}>
                {label}
              </Text>
              {detailParts.length ? (
                <Text style={styles.attachmentMeta}>
                  {detailParts.join(" • ")}
                </Text>
              ) : null}
              <Text style={styles.attachmentMeta} numberOfLines={1}>
                {attachment.url}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function TestTheBotScreen() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AutoReplyMessageTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatBubble[]>([]);
  const [replyConfig, setReplyConfig] = useState<BusinessReplyConfig | null>(
    null,
  );
  const [loadingConfig, setLoadingConfig] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const activeIdentifiers = useMemo(() => {
    const gmailId = user?.email?.trim() || null;
    const businessId = settings.businessId.trim() || null;
    return {
      gmailId,
      businessId,
    };
  }, [settings.businessId, user?.email]);

  useEffect(() => {
    const loadReplyConfig = async () => {
      const businessId = settings.businessId.trim();
      if (!businessId) {
        setReplyConfig(null);
        return;
      }

      setLoadingConfig(true);
      try {
        const config = await getBusinessReplyConfig({
          baseUrl: settings.apiBaseUrl,
          businessId,
        });
        setReplyConfig(config);
      } catch {
        setReplyConfig(null);
      } finally {
        setLoadingConfig(false);
      }
    };

    void loadReplyConfig();
  }, [settings.apiBaseUrl, settings.businessId]);

  const handleTest = async () => {
    if (!activeIdentifiers.gmailId && !activeIdentifiers.businessId) {
      Alert.alert(
        "Missing test identity",
        "Add a gmailId or businessId before testing the bot.",
      );
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      Alert.alert("Enter a message", "Add a customer message to test the bot.");
      return;
    }

    const userBubble: ChatBubble = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage,
    };

    setSubmitting(true);
    setError(null);
    setResult(null);
    setChat((current) => [...current, userBubble]);
    setMessage("");

    try {
      const response = await testAutoReplyMessage({
        baseUrl: settings.apiBaseUrl,
        payload: {
          gmailId: activeIdentifiers.gmailId,
          businessId: activeIdentifiers.businessId,
          message: trimmedMessage,
        },
      });
      setResult(response);

      setChat((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: response.matched
            ? response.finalReply ||
              response.selectedReply ||
              response.approvedReply ||
              "Reply found."
            : "No reply matched this message yet.",
          variant: response.matched ? "success" : "muted",
          attachments: response.matchedRule?.attachments || [],
          meta: response.matched
            ? [
                response.matchedPhrase
                  ? `Matched: ${response.matchedPhrase}`
                  : "Matched phrase unavailable",
                response.matchType
                  ? `Rule: ${response.matchType.replace(/_/g, " ")}`
                  : "Rule unavailable",
                response.matchedRule?.attachments?.length
                  ? `Attachments: ${response.matchedRule.attachments.length}`
                  : "Attachments: 0",
                `Contextual: ${response.contextualReplyEnabled ? "On" : "Off"}`,
                `Language: ${response.outputLanguage.replace(/_/g, " ")}`,
                response.similarityScore !== null
                  ? `Score: ${Math.round(response.similarityScore * 100)}%`
                  : `Rules checked: ${response.evaluatedRules}`,
              ]
            : [
                `Contextual: ${response.contextualReplyEnabled ? "On" : "Off"}`,
                `Language: ${response.outputLanguage.replace(/_/g, " ")}`,
                `Rules checked: ${response.evaluatedRules}`,
              ],
        },
      ]);
    } catch (testError) {
      const messageText =
        testError instanceof Error
          ? testError.message
          : "Unable to test the bot.";
      setError(messageText);
      setResult(null);
      setChat((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          role: "bot",
          text: messageText,
          variant: "muted",
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageScaffold
      title="Test Your Bot"
      subtitle="Your bot will reply to your customers message like it replies to you here."
    >
      <SectionCard title="Chat Test">
        <View style={styles.identityCard}>
          <View>
            <Text style={styles.identityLabel}>Smart reply config</Text>
            {loadingConfig ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator size="small" color={palette.primaryGreen} />
              </View>
            ) : (
              <Text style={styles.identityValue}>
                {replyConfig
                  ? `${replyConfig.contextualReplyEnabled ? "Contextual on" : "Contextual off"} - ${replyConfig.outputLanguage.replace(/_/g, " ")}${replyConfig.replyAim ? ` - Aim: ${replyConfig.replyAim}` : ""}`
                  : "Using default settings"}
              </Text>
            )}
          </View>
          <Ionicons
            name="options-outline"
            size={18}
            color={palette.primaryGreen}
          />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatStream}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        >
          {chat.length ? (
            chat.map((entry) => {
              const isUser = entry.role === "user";
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.bubbleRow,
                    isUser ? styles.bubbleRowUser : styles.bubbleRowBot,
                  ]}
                >
                  <View
                    style={[
                      styles.chatBubble,
                      isUser
                        ? styles.chatBubbleUser
                        : entry.variant === "success"
                          ? styles.chatBubbleSuccess
                          : styles.chatBubbleBot,
                    ]}
                  >
                    <Text
                      style={[styles.chatRole, isUser && styles.chatRoleUser]}
                    >
                      {isUser ? "You" : "Bot"}
                    </Text>
                    <Text
                      style={[styles.chatText, isUser && styles.chatTextUser]}
                    >
                      {entry.text}
                    </Text>
                    {entry.attachments?.length ? (
                      <AttachmentDetailsList attachments={entry.attachments} />
                    ) : null}
                    {entry.meta?.length ? (
                      <View style={styles.metaList}>
                        {entry.meta.map((item) => (
                          <Text key={item} style={styles.metaText}>
                            {item}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={palette.primaryGreen}
              />
              <Text style={styles.emptyTitle}>Start a test chat</Text>
              <Text style={styles.emptyText}>
                Try a customer message and see whether a saved rule responds
                before the main AI fallback.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextField
            label="Customer message"
            placeholder="Do you have parking?"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.textArea}
          />

          <View style={styles.composerFooter}>
            {error ? <Text style={styles.errorText}>{error}</Text> : <View />}
            <Pressable
              onPress={() => void handleTest()}
              style={[
                styles.primaryButton,
                (submitting || !message.trim()) && styles.primaryButtonDisabled,
              ]}
              disabled={submitting || !message.trim()}
            >
              <Ionicons
                name={submitting ? "hourglass-outline" : "send"}
                size={18}
                color={palette.textDark}
              />
              <Text style={styles.primaryButtonText}>
                {submitting ? "Testing..." : "Send Test"}
              </Text>
            </Pressable>
          </View>
        </View>

        {result?.matchedRule ? (
          <View style={styles.ruleSummary}>
            <Text style={styles.ruleSummaryLabel}>Last matched training</Text>
            <Text style={styles.ruleSummaryText}>
              {result.matchedRule.rule.replace(/_/g, " ")}
            </Text>
            {result.approvedReply ? (
              <Text style={styles.ruleSummaryHelper}>
                Approved reply: {result.approvedReply}
              </Text>
            ) : null}
            {result.finalReply && result.finalReply !== result.approvedReply ? (
              <Text style={styles.ruleSummaryHelper}>
                Final reply: {result.finalReply}
              </Text>
            ) : null}
            {result.matchedRule.attachments?.length ? (
              <View style={styles.ruleSummaryAttachments}>
                <Text style={styles.ruleSummaryHelper}>Attachments</Text>
                <AttachmentDetailsList
                  attachments={result.matchedRule.attachments}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(0,194,168,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,194,168,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  identityLabel: {
    color: "rgba(255,255,255,0.54)",
    fontFamily: typography.semibold,
    fontSize: typeScale.caption,
    textTransform: "uppercase",
  },
  identityValue: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: typeScale.label,
  },
  identityHelper: {
    color: "rgba(255,255,255,0.58)",
    fontFamily: typography.medium,
    fontSize: typeScale.caption,
    marginTop: 4,
  },
  loadingInline: {
    marginTop: 6,
    alignItems: "flex-start",
  },
  chatStream: {
    maxHeight: 420,
    minHeight: 320,
  },
  chatContent: {
    gap: 10,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowBot: {
    justifyContent: "flex-start",
  },
  chatBubble: {
    maxWidth: "88%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  chatBubbleUser: {
    backgroundColor: palette.primaryGreen,
  },
  chatBubbleBot: {
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  chatBubbleSuccess: {
    backgroundColor: "rgba(37,211,102,0.14)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.22)",
  },
  chatRole: {
    color: "rgba(255,255,255,0.58)",
    fontFamily: typography.semibold,
    fontSize: typeScale.caption,
    textTransform: "uppercase",
  },
  chatRoleUser: {
    color: "rgba(17,24,39,0.72)",
  },
  chatText: {
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: typeScale.body,
    lineHeight: 23,
  },
  chatTextUser: {
    color: palette.textDark,
  },
  metaList: {
    gap: 3,
  },
  attachmentList: {
    gap: 8,
    marginTop: 4,
  },
  attachmentCardDocument: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 10,
  },
  attachmentDocumentIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(37,211,102,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentCopy: {
    flex: 1,
    gap: 2,
  },
  attachmentTitle: {
    color: palette.textWhite,
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  attachmentMeta: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: 2,
  },
  metaText: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: typography.medium,
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
  composer: {
    gap: 10,
  },
  textArea: {
    minHeight: 92,
  },
  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: palette.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    minWidth: 142,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: typeScale.label,
  },
  errorText: {
    color: palette.warning,
    fontFamily: typography.semibold,
    fontSize: typeScale.caption,
    flex: 1,
  },
  ruleSummary: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: palette.borderDark,
    gap: 4,
  },
  ruleSummaryLabel: {
    color: "rgba(255,255,255,0.52)",
    fontFamily: typography.semibold,
    fontSize: typeScale.caption,
    textTransform: "uppercase",
  },
  ruleSummaryText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: typeScale.bodySecondary,
  },
  ruleSummaryHelper: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.medium,
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
  ruleSummaryAttachments: {
    gap: 6,
    marginTop: 2,
  },
  emptyState: {
    minHeight: 280,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(37,211,102,0.24)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: typeScale.body,
  },
  emptyText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.medium,
    fontSize: typeScale.bodySecondary,
    lineHeight: 21,
    textAlign: "center",
  },
});
