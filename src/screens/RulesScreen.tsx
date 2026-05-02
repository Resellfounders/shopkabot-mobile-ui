import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { RuleCard } from "../components/RuleCard";
import { RuleEditorModal } from "../components/RuleEditorModal";
import { SectionCard } from "../components/SectionCard";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useCurrentSubscription } from "../hooks/useCurrentSubscription";
import {
  createAutoReplyMessage,
  deleteAutoReplyMessage,
  listAutoReplyMessages,
  updateAutoReplyMessage,
} from "../services/api";
import {
  AutoReplyMessage,
  AutoReplyMessagePayload,
  TrainingDraft,
} from "../types/autoReply";
import { palette, typography } from "../theme/palette";

export function RulesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { hasActiveSubscription } = useCurrentSubscription();
  const [rules, setRules] = useState<AutoReplyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyMessage | null>(null);
  const [initialDraft, setInitialDraft] = useState<TrainingDraft | null>(null);

  const fetchRules = useCallback(
    async (isRefresh = false) => {
      if (!user?.email) {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        const result = await listAutoReplyMessages({
          baseUrl: settings.apiBaseUrl,
          gmailId: user.email,
          businessId: settings.businessId || undefined,
        });
        setRules(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load rules.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [settings.apiBaseUrl, settings.businessId, user?.email],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchRules();
    }, [fetchRules]),
  );

  const filteredRules = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return rules;
    }

    return rules.filter((rule) => {
      return (
        rule.rule.toLowerCase().includes(normalizedSearch) ||
        rule.incomingMessage.some((item) =>
          item.toLowerCase().includes(normalizedSearch),
        ) ||
        rule.replyMessage.some((item) =>
          item.toLowerCase().includes(normalizedSearch),
        )
      );
    });
  }, [rules, search]);

  const needsBusinessOnboarding =
    hasActiveSubscription &&
    (!settings.businessId.trim() || !settings.whatsappConnection);

  useEffect(() => {
    const draft = route.params?.prefillTraining as TrainingDraft | undefined;
    if (!draft) {
      return;
    }

    setEditingRule(null);
    setInitialDraft(draft);
    setEditorVisible(true);
    navigation.setParams({ prefillTraining: undefined });
  }, [navigation, route.params?.prefillTraining]);

  const handleSave = async (
    payload: AutoReplyMessagePayload,
    editingId?: string,
  ) => {
    try {
      if (editingId) {
        await updateAutoReplyMessage({
          baseUrl: settings.apiBaseUrl,
          id: editingId,
          payload,
        });
      } else {
        await createAutoReplyMessage({
          baseUrl: settings.apiBaseUrl,
          payload,
        });
      }

      setEditingRule(null);
      await fetchRules();
    } catch (saveError) {
      Alert.alert(
        "Unable to save rule",
        saveError instanceof Error ? saveError.message : "Please try again.",
      );
      throw saveError;
    }
  };

  const handleDelete = (rule: AutoReplyMessage) => {
    Alert.alert(
      "Delete rule",
      "This auto-reply rule will be removed permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAutoReplyMessage({
                baseUrl: settings.apiBaseUrl,
                id: rule.id,
              });
              await fetchRules();
            } catch (deleteError) {
              Alert.alert(
                "Delete failed",
                deleteError instanceof Error
                  ? deleteError.message
                  : "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <PageScaffold title="Train The Bot">
        <SectionCard title="New Training">
          <View style={styles.stepBanner}>
            <Text style={styles.stepTitle}>Add a training example</Text>
            <Text style={styles.stepText}>
              Add the message, matching rule, and reply.
            </Text>
            <Pressable
              style={styles.inlineCreateButton}
              onPress={() => {
                setEditingRule(null);
                setInitialDraft(null);
                setEditorVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color={palette.textDark} />
              <Text style={styles.inlineCreateButtonText}>
                Add Training Example
              </Text>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard title="Library">
          <TextField
            label="Search training"
            placeholder="Search by customer question, reply, or matching style"
            value={search}
            onChangeText={setSearch}
          />

          {loading ? (
            <ActivityIndicator color={palette.primaryGreen} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ScrollView
              style={styles.ruleList}
              contentContainerStyle={styles.ruleListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void fetchRules(true)}
                  tintColor={palette.primaryGreen}
                />
              }
            >
              {filteredRules.length ? (
                filteredRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={(selectedRule) => {
                      setEditingRule(selectedRule);
                      setInitialDraft(null);
                      setEditorVisible(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="sparkles-outline"
                    size={28}
                    color={palette.primaryGreen}
                  />
                  <Text style={styles.emptyTitle}>No training found</Text>
                  <Text style={styles.emptyText}>
                    Add your first training example.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </SectionCard>
      </PageScaffold>

      <Pressable
        style={styles.fab}
        onPress={() => {
          setEditingRule(null);
          setInitialDraft(null);
          setEditorVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color={palette.textDark} />
      </Pressable>

      {!hasActiveSubscription ? (
        <View style={styles.bottomStepBar}>
          <View style={styles.bottomStepCopy}>
            <Text style={styles.bottomStepLabel}>Next Step</Text>
            <Text style={styles.bottomStepText}>
              Go to Subscription to activate the bot.
            </Text>
          </View>
          <Pressable
            style={styles.activateButton}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.activateButtonText}>Activate Bot</Text>
          </Pressable>
        </View>
      ) : needsBusinessOnboarding ? (
        <View style={styles.bottomStepBar}>
          <View style={styles.bottomStepCopy}>
            <Text style={styles.bottomStepLabel}>Next Step</Text>
            <Text style={styles.bottomStepText}>
              Your plan is active. Connect WhatsApp Business to activate the bot.
            </Text>
          </View>
          <Pressable
            style={styles.activateButton}
            onPress={() => navigation.navigate("Connect WhatsApp")}
          >
            <Text style={styles.activateButtonText}>Onboard Business</Text>
          </Pressable>
        </View>
      ) : null}

      <RuleEditorModal
        visible={editorVisible}
        editingRule={editingRule}
        initialDraft={initialDraft}
        gmailId={user?.email || ""}
        businessId={settings.businessId.trim() || null}
        onClose={() => {
          setEditorVisible(false);
          setEditingRule(null);
          setInitialDraft(null);
        }}
        onSubmit={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  ruleList: {
    maxHeight: 620,
  },
  stepBanner: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(37,211,102,0.1)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.2)",
    gap: 8,
  },
  stepTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 20,
    lineHeight: 26,
  },
  stepText: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  inlineCreateButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: palette.primaryGreen,
    marginTop: 2,
  },
  inlineCreateButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  ruleListContent: {
    gap: 12,
    paddingBottom: 10,
  },
  errorText: {
    color: palette.warning,
    fontFamily: typography.semibold,
    fontSize: 14,
  },
  emptyState: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  emptyTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 18,
  },
  emptyText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.medium,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 106,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 10,
  },
  bottomStepBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "rgba(5,5,5,0.96)",
    borderTopWidth: 1,
    borderTopColor: palette.borderDark,
  },
  bottomStepCopy: {
    flex: 1,
    gap: 1,
  },
  bottomStepLabel: {
    color: palette.primaryGreen,
    fontFamily: typography.extrabold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  bottomStepText: {
    color: palette.textWhite,
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  activateButton: {
    minWidth: 144,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: palette.primaryGreen,
  },
  activateButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
});
