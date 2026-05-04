import { Pressable, StyleSheet, Text, View } from "react-native";

import { AutoReplyMessage } from "../types/autoReply";
import { formatRelativeDate } from "../utils/format";
import { palette, typography } from "../theme/palette";

type RuleCardProps = {
  rule: AutoReplyMessage;
  onEdit: (rule: AutoReplyMessage) => void;
  onDelete: (rule: AutoReplyMessage) => void;
};

export function RuleCard({ rule, onEdit, onDelete }: RuleCardProps) {
  const attachmentPreview =
    rule.attachments
      ?.slice(0, 2)
      .map((attachment) => attachment.filename || attachment.url) || [];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.ruleBadge}>
          <Text style={styles.ruleBadgeText}>{rule.rule}</Text>
        </View>
        <Text style={styles.timeText}>
          Updated {formatRelativeDate(rule.updatedAt)}
        </Text>
      </View>

      <Text style={styles.heading}>
        {rule.incomingMessage[0] || "Auto reply rule"}
      </Text>
      <Text style={styles.caption}>
        {rule.incomingMessage.length} trigger phrase
        {rule.incomingMessage.length === 1 ? "" : "s"} • {rule.replyMessage.length}{" "}
        reply option
        {rule.replyMessage.length === 1 ? "" : "s"}
        {rule.attachments?.length
          ? ` • ${rule.attachments.length} attachment${rule.attachments.length === 1 ? "" : "s"}`
          : ""}
      </Text>

      <View style={styles.previewBlock}>
        <Text style={styles.previewLabel}>Incoming</Text>
        <Text style={styles.previewText}>
          {rule.incomingMessage.slice(0, 3).join(" • ")}
        </Text>
      </View>

      <View style={styles.previewBlock}>
        <Text style={styles.previewLabel}>Replies</Text>
        <Text style={styles.previewText}>
          {rule.replyMessage.slice(0, 2).join(" • ")}
        </Text>
      </View>

      {attachmentPreview.length ? (
        <View style={styles.previewBlock}>
          <Text style={styles.previewLabel}>Attachments</Text>
          <Text style={styles.previewText}>{attachmentPreview.join(" • ")}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => onEdit(rule)}>
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.dangerButton} onPress={() => onDelete(rule)}>
          <Text style={styles.dangerButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  ruleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0, 194, 168, 0.16)",
    maxWidth: "68%",
  },
  ruleBadgeText: {
    color: palette.accentTeal,
    fontFamily: typography.semibold,
    fontSize: 12,
  },
  timeText: {
    color: "rgba(255,255,255,0.46)",
    fontFamily: typography.medium,
    fontSize: 12,
  },
  heading: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  caption: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: typography.medium,
    fontSize: 14,
  },
  previewBlock: {
    gap: 4,
  },
  previewLabel: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  previewText: {
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  secondaryButtonText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  dangerButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  dangerButtonText: {
    color: palette.danger,
    fontFamily: typography.bold,
    fontSize: 14,
  },
});
