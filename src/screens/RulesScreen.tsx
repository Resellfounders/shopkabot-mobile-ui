import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { useUserSettingsBusiness } from "../hooks/useUserSettingsBusiness";
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

const FREE_RULE_LIMIT = 5;
const DUPLICATE_RULE_ERROR = "DUPLICATE_RULE";

function normalizeComparisonText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function hasDuplicateTrainingPair(
  existingRules: AutoReplyMessage[],
  payload: AutoReplyMessagePayload,
  editingId?: string,
) {
  const incomingMessages = new Set(
    payload.incomingMessage.map(normalizeComparisonText).filter(Boolean),
  );
  const replyMessages = new Set(
    payload.replyMessage.map(normalizeComparisonText).filter(Boolean),
  );

  if (!incomingMessages.size || !replyMessages.size) {
    return false;
  }

  return existingRules.some((rule) => {
    if (editingId && rule.id === editingId) {
      return false;
    }

    const hasMatchingIncoming = rule.incomingMessage.some((message) =>
      incomingMessages.has(normalizeComparisonText(message)),
    );
    if (!hasMatchingIncoming) {
      return false;
    }

    return rule.replyMessage.some((message) =>
      replyMessages.has(normalizeComparisonText(message)),
    );
  });
}

export function RulesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { hasActiveSubscription, loadingSubscription } =
    useCurrentSubscription();
  const { resolvedBusinessId, hasConnectedBusiness } = useUserSettingsBusiness();
  const [rules, setRules] = useState<AutoReplyMessage[]>([]);
  const [totalRuleCount, setTotalRuleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyMessage | null>(null);
  const [initialDraft, setInitialDraft] = useState<TrainingDraft | null>(null);
  const [returnToHistoryOnClose, setReturnToHistoryOnClose] = useState(false);

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
        const [scopedRules, allAccountRules] = await Promise.all([
          listAutoReplyMessages({
            baseUrl: settings.apiBaseUrl,
            gmailId: user.email,
            businessId: resolvedBusinessId || undefined,
          }),
          listAutoReplyMessages({
            baseUrl: settings.apiBaseUrl,
            gmailId: user.email,
          }),
        ]);
        setRules(scopedRules);
        setTotalRuleCount(allAccountRules.length);
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
    [resolvedBusinessId, settings.apiBaseUrl, user?.email],
  );

  const hasReachedFreeRuleLimit =
    !loadingSubscription &&
    !hasActiveSubscription &&
    totalRuleCount >= FREE_RULE_LIMIT;
  const remainingFreeRules = Math.max(0, FREE_RULE_LIMIT - totalRuleCount);

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
    !hasConnectedBusiness;

  const showRuleLimitLockedState = useCallback(() => {
    const message = `Free plan allows up to ${FREE_RULE_LIMIT} training rules. Subscribe to unlock more rule creation.`;

    if (Platform.OS === "web") {
      globalThis.alert?.(message);
      navigation.navigate("Subscription");
      return;
    }

    Alert.alert("Rule limit reached", message, [
      { text: "Not now", style: "cancel" },
      {
        text: "Go to Subscription",
        onPress: () => navigation.navigate("Subscription"),
      },
    ]);
  }, [navigation]);

  const openCreateRuleEditor = useCallback(
    (draft?: TrainingDraft | null) => {
      if (hasReachedFreeRuleLimit) {
        showRuleLimitLockedState();
        return;
      }

      setEditingRule(null);
      setInitialDraft(draft ?? null);
      setEditorVisible(true);
    },
    [hasReachedFreeRuleLimit, showRuleLimitLockedState],
  );

  useEffect(() => {
    const draft = route.params?.prefillTraining as TrainingDraft | undefined;
    if (!draft) {
      return;
    }

    setReturnToHistoryOnClose(Boolean(route.params?.openedFromHistory));
    openCreateRuleEditor(draft);
    navigation.setParams({
      prefillTraining: undefined,
      openedFromHistory: undefined,
    });
  }, [
    navigation,
    openCreateRuleEditor,
    route.params?.openedFromHistory,
    route.params?.prefillTraining,
  ]);

  const closeEditor = useCallback(
    (shouldNavigateBack = returnToHistoryOnClose) => {
      setEditorVisible(false);
      setEditingRule(null);
      setInitialDraft(null);
      setReturnToHistoryOnClose(false);

      if (shouldNavigateBack) {
        navigation.navigate("Reply History");
      }
    },
    [navigation, returnToHistoryOnClose],
  );

  const handleSave = async (
    payload: AutoReplyMessagePayload,
    editingId?: string,
  ) => {
    if (!editingId && hasReachedFreeRuleLimit) {
      showRuleLimitLockedState();
      throw new Error(
        `Free plan allows up to ${FREE_RULE_LIMIT} training rules.`,
      );
    }

    if (hasDuplicateTrainingPair(rules, payload, editingId)) {
      Alert.alert(
        "Already present",
        "This input message and reply message are already saved in training.",
      );
      throw new Error(DUPLICATE_RULE_ERROR);
    }

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
      if (
        saveError instanceof Error &&
        saveError.message === DUPLICATE_RULE_ERROR
      ) {
        throw saveError;
      }

      Alert.alert(
        "Unable to save rule",
        saveError instanceof Error ? saveError.message : "Please try again.",
      );
      throw saveError;
    }
  };

  const handleDelete = (rule: AutoReplyMessage) => {
    const deleteRule = async () => {
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
    };

    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm?.(
        "This auto-reply rule will be removed permanently.",
      );
      if (confirmed) {
        void deleteRule();
      }
      return;
    }

    Alert.alert(
      "Delete rule",
      "This auto-reply rule will be removed permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteRule();
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
            {!loadingSubscription && !hasActiveSubscription ? (
              <View
                style={[
                  styles.limitBanner,
                  hasReachedFreeRuleLimit
                    ? styles.limitBannerLocked
                    : styles.limitBannerOpen,
                ]}
              >
                <Ionicons
                  name={
                    hasReachedFreeRuleLimit
                      ? "lock-closed-outline"
                      : "sparkles-outline"
                  }
                  size={16}
                  color={
                    hasReachedFreeRuleLimit
                      ? palette.warning
                      : palette.primaryGreen
                  }
                />
                <Text
                  style={[
                    styles.limitBannerText,
                    hasReachedFreeRuleLimit && styles.limitBannerTextLocked,
                  ]}
                >
                  {hasReachedFreeRuleLimit
                    ? `Free plan limit reached: ${totalRuleCount}/${FREE_RULE_LIMIT} rules used`
                    : `Free plan: ${totalRuleCount}/${FREE_RULE_LIMIT} rules used. ${remainingFreeRules} left before unlock is required.`}
                </Text>
              </View>
            ) : null}
            <Pressable
              style={[
                styles.inlineCreateButton,
                hasReachedFreeRuleLimit && styles.inlineCreateButtonLocked,
              ]}
              onPress={() => openCreateRuleEditor()}
            >
              <Ionicons
                name={hasReachedFreeRuleLimit ? "lock-closed" : "add"}
                size={18}
                color={palette.textDark}
              />
              <Text style={styles.inlineCreateButtonText}>
                {hasReachedFreeRuleLimit
                  ? "Unlock More Rules"
                  : "Add Training Example"}
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
        style={[styles.fab, hasReachedFreeRuleLimit && styles.fabLocked]}
        onPress={() => openCreateRuleEditor()}
      >
        <Ionicons
          name={hasReachedFreeRuleLimit ? "lock-closed" : "add"}
          size={30}
          color={palette.textDark}
        />
      </Pressable>

      {!loadingSubscription && !hasActiveSubscription ? (
        <View style={styles.bottomStepBar}>
          <View style={styles.bottomStepCopy}>
            <Text style={styles.bottomStepLabel}>Next Step</Text>
            <Text style={styles.bottomStepText}>
              {hasReachedFreeRuleLimit
                ? `You have used all ${FREE_RULE_LIMIT} free rules. Subscribe to keep training the bot.`
                : "Go to Subscription to activate the bot."}
            </Text>
          </View>
          <Pressable
            style={styles.activateButton}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.activateButtonText}>
              {hasReachedFreeRuleLimit ? "Unlock Rules" : "Activate Bot"}
            </Text>
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
        businessId={resolvedBusinessId || null}
        apiBaseUrl={settings.apiBaseUrl}
        onClose={() => closeEditor()}
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
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  limitBannerOpen: {
    backgroundColor: "rgba(37,211,102,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.2)",
  },
  limitBannerLocked: {
    backgroundColor: "rgba(255,159,67,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.25)",
  },
  limitBannerText: {
    flex: 1,
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  limitBannerTextLocked: {
    color: palette.warning,
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
  inlineCreateButtonLocked: {
    backgroundColor: "#D8A019",
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
  fabLocked: {
    backgroundColor: "#D8A019",
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
