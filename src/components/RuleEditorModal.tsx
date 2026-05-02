import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AutoReplyMessage,
  AutoReplyMessagePayload,
  TrainingDraft,
} from "../types/autoReply";
import { palette, typography } from "../theme/palette";
import { TextField } from "./TextField";

type RuleEditorModalProps = {
  visible: boolean;
  editingRule: AutoReplyMessage | null;
  initialDraft?: TrainingDraft | null;
  gmailId: string;
  businessId: string | null;
  onClose: () => void;
  onSubmit: (
    payload: AutoReplyMessagePayload,
    editingId?: string,
  ) => Promise<void>;
};

const ruleSuggestions = [
  "exact_match",
  "contains_phrase",
  "starts_with",
  "smart_intent_match",
];

export function RuleEditorModal({
  visible,
  editingRule,
  initialDraft,
  gmailId,
  businessId,
  onClose,
  onSubmit,
}: RuleEditorModalProps) {
  const [incomingMessages, setIncomingMessages] = useState<string[]>([""]);
  const [rule, setRule] = useState("contains_phrase");
  const [replyMessages, setReplyMessages] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setIncomingMessages(
        editingRule.incomingMessage.length ? editingRule.incomingMessage : [""],
      );
      setRule(editingRule.rule);
      setReplyMessages(
        editingRule.replyMessage.length ? editingRule.replyMessage : [""],
      );
      return;
    }

    if (initialDraft) {
      setIncomingMessages(
        initialDraft.incomingMessage.length ? initialDraft.incomingMessage : [""],
      );
      setRule(initialDraft.rule || "contains_phrase");
      setReplyMessages(
        initialDraft.replyMessage.length ? initialDraft.replyMessage : [""],
      );
      return;
    }

    setIncomingMessages([""]);
    setRule("contains_phrase");
    setReplyMessages([""]);
  }, [editingRule, initialDraft, visible]);

  const updateListItem = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number,
    value: string,
  ) => {
    const nextItems = [...items];
    nextItems[index] = value;
    setItems(nextItems);
  };

  const addListItem = (
    items: string[],
    setItems: (items: string[]) => void,
  ) => {
    setItems([...items, ""]);
  };

  const removeListItem = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number,
  ) => {
    if (items.length === 1) {
      setItems([""]);
      return;
    }

    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const sanitizeItems = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean);

  const handleSubmit = async () => {
    const sanitizedIncomingMessages = sanitizeItems(incomingMessages);
    const sanitizedReplyMessages = sanitizeItems(replyMessages);

    if (!sanitizedIncomingMessages.length) {
      Alert.alert(
        "Add an incoming message",
        "Add at least one customer message so ShopKaBot knows what to match.",
      );
      return;
    }

    if (!sanitizedReplyMessages.length) {
      Alert.alert(
        "Add a reply message",
        "Add at least one reply so ShopKaBot knows what it should send.",
      );
      return;
    }

    const payload: AutoReplyMessagePayload = {
      businessId,
      gmailId,
      incomingMessage: sanitizedIncomingMessages,
      rule: rule.trim(),
      replyMessage: sanitizedReplyMessages,
    };

    setSaving(true);
    try {
      await onSubmit(payload, editingRule?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>
                {editingRule
                  ? "Edit training example"
                  : initialDraft
                    ? "Create training from reply history"
                    : "New training example"}
              </Text>
              <Text style={styles.subtitle}>
                {initialDraft
                  ? "Review the customer message and bot reply, then save it as a new training example."
                  : "Add the message, choose the rule, and teach ShopKaBot what reply to send."}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.editorSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionTitle}>Customer messages</Text>
                  <Text style={styles.sectionSubtitle}>
                    Add each message separately so the bot learns every way a
                    customer might ask.
                  </Text>
                </View>
              </View>

              <View style={styles.itemList}>
                {incomingMessages.map((message, index) => (
                  <View key={`incoming-${index}`} style={styles.trainingItem}>
                    <TextField
                      label={`Incoming message ${index + 1}`}
                      value={message}
                      onChangeText={(value) =>
                        updateListItem(
                          incomingMessages,
                          setIncomingMessages,
                          index,
                          value,
                        )
                      }
                      placeholder={
                        index === 0
                          ? "What are your timings?"
                          : "Do you open on Sunday?"
                      }
                    />
                    <Pressable
                      style={styles.removeButton}
                      onPress={() =>
                        removeListItem(
                          incomingMessages,
                          setIncomingMessages,
                          index,
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="rgba(255,255,255,0.72)"
                      />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.addButton}
                onPress={() =>
                  addListItem(incomingMessages, setIncomingMessages)
                }
              >
                <Ionicons name="add" size={18} color={palette.primaryGreen} />
                <Text style={styles.addButtonText}>Add incoming message</Text>
              </Pressable>
            </View>

            <View style={styles.editorSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionTitle}>Choose matching rule</Text>
                  <Text style={styles.sectionSubtitle}>
                    Pick how ShopKaBot should compare the incoming message
                    before sending a reply.
                  </Text>
                </View>
              </View>

              <View style={styles.rulePills}>
                {ruleSuggestions.map((suggestion) => {
                  const isActive = rule === suggestion;
                  return (
                    <Pressable
                      key={suggestion}
                      style={[
                        styles.rulePill,
                        isActive && styles.rulePillActive,
                      ]}
                      onPress={() => setRule(suggestion)}
                    >
                      <Text
                        style={[
                          styles.rulePillText,
                          isActive && styles.rulePillTextActive,
                        ]}
                      >
                        {suggestion.replace(/_/g, " ")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextField
                label="Backend rule value"
                helper="Use smart_intent_match for fuzzy message similarity instead of exact wording."
                value={rule}
                onChangeText={setRule}
                placeholder="contains_phrase"
              />
            </View>

            <View style={styles.editorSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionTitle}>Bot replies</Text>
                  <Text style={styles.sectionSubtitle}>
                    Add one or more replies that ShopKaBot can send when this
                    rule matches.
                  </Text>
                </View>
              </View>

              <View style={styles.itemList}>
                {replyMessages.map((message, index) => (
                  <View key={`reply-${index}`} style={styles.trainingItem}>
                    <TextField
                      label={`Reply message ${index + 1}`}
                      value={message}
                      onChangeText={(value) =>
                        updateListItem(
                          replyMessages,
                          setReplyMessages,
                          index,
                          value,
                        )
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholder={
                        index === 0
                          ? "We are open from 10 AM to 7 PM."
                          : "Want me to share today's available slots too?"
                      }
                    />
                    <Pressable
                      style={styles.removeButton}
                      onPress={() =>
                        removeListItem(replyMessages, setReplyMessages, index)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="rgba(255,255,255,0.72)"
                      />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.addButton}
                onPress={() => addListItem(replyMessages, setReplyMessages)}
              >
                <Ionicons name="add" size={18} color={palette.primaryGreen} />
                <Text style={styles.addButtonText}>Add reply message</Text>
              </Pressable>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Save target</Text>
              <Text style={styles.infoText}>
                {businessId
                  ? `This training will be saved for businessId "${businessId}" and gmailId "${gmailId}".`
                  : `This training will be saved without a businessId and linked to gmailId "${gmailId}".`}
              </Text>
              {initialDraft?.sourceLabel ? (
                <Text style={styles.infoText}>
                  Source: {initialDraft.sourceLabel}
                </Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryButton,
                saving && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? "Saving..."
                  : editingRule
                    ? "Update Training"
                    : "Save Training"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: palette.primaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderDark,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 22,
  },
  subtitle: {
    color: "rgba(255,255,255,0.66)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.cardBackgroundAlt,
  },
  closeText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  content: {
    gap: 18,
    paddingBottom: 12,
  },
  editorSection: {
    gap: 14,
    backgroundColor: "rgba(16,28,23,0.88)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderDark,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumberText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 19,
  },
  itemList: {
    gap: 12,
  },
  trainingItem: {
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(7,17,13,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  removeButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.cardBackgroundAlt,
  },
  removeButtonText: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.semibold,
    fontSize: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.34)",
    backgroundColor: "rgba(37,211,102,0.08)",
    paddingVertical: 12,
  },
  addButtonText: {
    color: palette.primaryGreen,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  rulePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rulePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  rulePillActive: {
    backgroundColor: "rgba(37,211,102,0.12)",
    borderColor: "rgba(37,211,102,0.36)",
  },
  rulePillText: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "capitalize",
  },
  rulePillTextActive: {
    color: palette.primaryGreen,
  },
  infoBox: {
    backgroundColor: "rgba(0,194,168,0.12)",
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  infoTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  infoText: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 16,
    backgroundColor: palette.primaryGreen,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
});
