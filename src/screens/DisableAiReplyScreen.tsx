import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { TextField } from "../components/TextField";
import { useAppSettings } from "../context/AppSettingsContext";
import { useCurrentSubscription } from "../hooks/useCurrentSubscription";
import {
  addDisabledNumber,
  getBusinessReplyConfig,
  removeDisabledNumber,
  updateBusinessReplyConfig,
} from "../services/api";
import { BusinessReplyConfig, OutputLanguage } from "../types/autoReply";
import { palette, typography } from "../theme/palette";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

const outputLanguageOptions: Array<{
  value: OutputLanguage;
  label: string;
  description: string;
}> = [
  {
    value: "same_as_user",
    label: "Same As Customer",
    description: "Mirror the tone and language of the incoming message.",
  },
  {
    value: "english",
    label: "English",
    description: "Keep contextual replies in English.",
  },
  {
    value: "hindi",
    label: "Hindi",
    description: "Use simple Hindi in English script.",
  },
  {
    value: "hinglish",
    label: "Hinglish",
    description: "Use a natural Indian WhatsApp style.",
  },
];

export function DisableAiReplyScreen() {
  const navigation = useNavigation<any>();
  const { settings } = useAppSettings();
  const { hasActiveSubscription, loadingSubscription } =
    useCurrentSubscription();
  const businessId = settings.businessId.trim();

  const [config, setConfig] = useState<BusinessReplyConfig | null>(null);
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [removingPhone, setRemovingPhone] = useState<string | null>(null);
  const [contextualReplyEnabled, setContextualReplyEnabled] = useState(true);
  const [outputLanguage, setOutputLanguage] =
    useState<OutputLanguage>("same_as_user");

  const loadConfig = async () => {
    if (!businessId) {
      setConfig(null);
      setContextualReplyEnabled(true);
      setOutputLanguage("same_as_user");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    try {
      const nextConfig = await getBusinessReplyConfig({
        baseUrl: settings.apiBaseUrl,
        businessId,
      });
      setConfig(nextConfig);
      setContextualReplyEnabled(nextConfig.contextualReplyEnabled);
      setOutputLanguage(nextConfig.outputLanguage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load smart reply settings.";
      showMessage("Load failed", message);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, [businessId, settings.apiBaseUrl]);

  const filteredNumbers = useMemo(() => {
    const query = normalizePhone(search);
    const source = config?.disableAIReplies || [];
    if (!query) {
      return source;
    }
    return source.filter((item) => item.includes(query));
  }, [config, search]);

  const handleSaveSettings = async () => {
    if (!businessId) {
      navigation.navigate("Connect WhatsApp");
      return;
    }

    try {
      setSavingSettings(true);
      await updateBusinessReplyConfig({
        baseUrl: settings.apiBaseUrl,
        businessId,
        payload: {
          contextualReplyEnabled,
          outputLanguage,
        },
      });
      await loadConfig();
      showMessage("Saved", "Smart reply settings updated.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save smart reply settings.";
      showMessage("Save failed", message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAdd = async () => {
    const normalizedPhone = normalizePhone(phone);
    if (!businessId) {
      navigation.navigate("Connect WhatsApp");
      return;
    }

    if (!normalizedPhone) {
      showMessage("Enter a number", "Add the customer number first.");
      return;
    }

    try {
      setSubmitting(true);
      await addDisabledNumber({
        baseUrl: settings.apiBaseUrl,
        businessId,
        phone: normalizedPhone,
      });
      setPhone("");
      await loadConfig();
      showMessage("Saved", "AI replies are disabled for this number.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to disable AI replies for this number.";
      showMessage("Save failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (value: string) => {
    if (!businessId) {
      return;
    }

    try {
      setRemovingPhone(value);
      await removeDisabledNumber({
        baseUrl: settings.apiBaseUrl,
        businessId,
        phone: value,
      });
      await loadConfig();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to remove this number.";
      showMessage("Remove failed", message);
    } finally {
      setRemovingPhone(null);
    }
  };

  if (loadingSubscription) {
    return (
      <PageScaffold title="Smart Reply Settings" subtitle="Checking your plan.">
        <SectionCard title="Loading">
          <View style={styles.lockedState}>
            <ActivityIndicator size="small" color={palette.primaryGreen} />
            <Text style={styles.lockedCopy}>Loading plan status...</Text>
          </View>
        </SectionCard>
      </PageScaffold>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <PageScaffold
        title="Smart Reply Settings"
        subtitle="Bot controls unlock after plan activation."
      >
        <SectionCard title="Subscription Required">
          <View style={styles.lockedState}>
            <View style={styles.lockedIconWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={palette.warning}
              />
            </View>
            <Text style={styles.lockedTitle}>Plan activation needed</Text>
            <Text style={styles.lockedCopy}>
              Activate a plan first to manage contextual replies and manual
              handoff numbers.
            </Text>
            <Pressable
              style={styles.lockedButton}
              onPress={() => navigation.navigate("Subscription")}
            >
              <Text style={styles.lockedButtonText}>Go To Subscription</Text>
            </Pressable>
          </View>
        </SectionCard>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title="Smart Reply Settings"
      subtitle="Control how your bot replies and when to handoff to a human."
    >
      <SectionCard title="Contextual Reply">
        <View style={styles.scopeRow}>
          <View style={styles.scopePill}>
            <Text style={styles.scopeLabel}>Business</Text>
            <Text style={styles.scopeValue}>
              {businessId || "Not connected"}
            </Text>
          </View>
          <View style={styles.scopePill}>
            <Text style={styles.scopeLabel}>Mode</Text>
            <Text style={styles.scopeValue}>
              {contextualReplyEnabled ? "Contextual on" : "Direct reply"}
            </Text>
          </View>
        </View>

        {!businessId ? (
          <View style={styles.noticeCard}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={palette.warning}
            />
            <Text style={styles.noticeText}>
              Connect WhatsApp Business first. These settings are saved per
              business number.
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => setContextualReplyEnabled((current) => !current)}
          style={[
            styles.toggleCard,
            contextualReplyEnabled && styles.toggleCardActive,
          ]}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>
              Enable AI contextual reply after matching
            </Text>
            <Text style={styles.toggleText}>
              When this is off, the bot sends the saved approved reply directly.
              When it is on, the backend makes the reply more natural while
              still staying inside the approved rule context.
            </Text>
          </View>
          <View
            style={[
              styles.toggleBadge,
              contextualReplyEnabled && styles.toggleBadgeActive,
            ]}
          >
            <Ionicons
              name={contextualReplyEnabled ? "checkmark" : "remove"}
              size={18}
              color={
                contextualReplyEnabled
                  ? palette.textDark
                  : "rgba(255,255,255,0.72)"
              }
            />
          </View>
        </Pressable>

        <View style={styles.languageGrid}>
          {outputLanguageOptions.map((option) => {
            const active = outputLanguage === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.languageCard,
                  active && styles.languageCardActive,
                ]}
                onPress={() => setOutputLanguage(option.value)}
              >
                <Text
                  style={[
                    styles.languageTitle,
                    active && styles.languageTitleActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.languageDescription}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            if (!businessId) {
              navigation.navigate("Connect WhatsApp");
              return;
            }
            void handleSaveSettings();
          }}
          style={[
            styles.primaryButton,
            (!businessId || savingSettings) && styles.primaryButtonDisabled,
          ]}
          disabled={savingSettings}
        >
          <Ionicons
            name={businessId ? "save-outline" : "business-outline"}
            size={18}
            color={palette.textDark}
          />
          <Text style={styles.primaryButtonText}>
            {!businessId
              ? "Connect Business To Save"
              : savingSettings
                ? "Saving..."
                : "Save Smart Reply Settings"}
          </Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Disable AI Reply For Specific Numbers">
        <View style={styles.scopeRow}>
          <View style={styles.scopePill}>
            <Text style={styles.scopeLabel}>Disabled</Text>
            <Text style={styles.scopeValue}>
              {config?.disableAIReplies.length || 0}
            </Text>
          </View>
        </View>

        <TextField
          label="Customer number"
          placeholder="e.g. 919004513947"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          helper="Saved in digits-only format."
        />

        <Pressable
          onPress={() => void handleAdd()}
          style={[
            styles.primaryButton,
            (submitting || !phone.trim()) && styles.primaryButtonDisabled,
          ]}
          disabled={submitting || !phone.trim()}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={palette.textDark}
          />
          <Text style={styles.primaryButtonText}>
            {submitting ? "Saving..." : "Disable AI Reply"}
          </Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Disabled Numbers">
        <TextField
          label="Search"
          placeholder="Search digits"
          value={search}
          onChangeText={setSearch}
          keyboardType="number-pad"
        />

        {pageLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={palette.primaryGreen} />
          </View>
        ) : !businessId ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="business-outline"
              size={22}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={styles.emptyTitle}>Business setup needed</Text>
            <Text style={styles.emptyCopy}>
              Finish the WhatsApp connection first.
            </Text>
          </View>
        ) : filteredNumbers.length ? (
          <View style={styles.listWrap}>
            {filteredNumbers.map((item) => (
              <View key={item} style={styles.numberRow}>
                <View style={styles.numberCopy}>
                  <Text style={styles.numberLabel}>WhatsApp Number</Text>
                  <Text style={styles.numberValue}>{item}</Text>
                </View>

                <Pressable
                  onPress={() => void handleRemove(item)}
                  style={[
                    styles.removeButton,
                    removingPhone === item && styles.removeButtonDisabled,
                  ]}
                  disabled={removingPhone === item}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={palette.danger}
                  />
                  <Text style={styles.removeButtonText}>
                    {removingPhone === item ? "Removing..." : "Remove"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={palette.primaryGreen}
            />
            <Text style={styles.emptyTitle}>
              {search ? "No matching numbers" : "No disabled numbers"}
            </Text>
            <Text style={styles.emptyCopy}>
              {search
                ? "Try a different search."
                : "Add a number above when a chat should stay manual."}
            </Text>
          </View>
        )}
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  lockedState: {
    minHeight: 220,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  lockedIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  lockedTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 20,
    textAlign: "center",
  },
  lockedCopy: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  lockedButton: {
    marginTop: 2,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  lockedButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  scopeRow: {
    gap: 10,
  },
  scopePill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    padding: 12,
    gap: 4,
  },
  scopeLabel: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  scopeValue: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  toggleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  toggleCardActive: {
    borderColor: "rgba(37,211,102,0.28)",
    backgroundColor: "rgba(37,211,102,0.08)",
  },
  toggleCopy: {
    flex: 1,
    gap: 5,
  },
  toggleTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  toggleText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  toggleBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  toggleBadgeActive: {
    backgroundColor: palette.primaryGreen,
  },
  noticeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.24)",
    backgroundColor: "rgba(245,158,11,0.08)",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  languageGrid: {
    gap: 10,
  },
  languageCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    padding: 12,
    gap: 4,
  },
  languageCardActive: {
    borderColor: "rgba(37,211,102,0.28)",
    backgroundColor: "rgba(37,211,102,0.1)",
  },
  languageTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  languageTitleActive: {
    color: palette.primaryGreen,
  },
  languageDescription: {
    color: "rgba(255,255,255,0.66)",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: palette.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  loadingWrap: {
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    minHeight: 130,
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
    textAlign: "center",
  },
  emptyCopy: {
    color: "rgba(255,255,255,0.66)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  listWrap: {
    gap: 10,
  },
  numberRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    padding: 12,
    gap: 10,
  },
  numberCopy: {
    gap: 4,
  },
  numberLabel: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: typography.semibold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  numberValue: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  removeButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.26)",
    backgroundColor: "rgba(239,68,68,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  removeButtonDisabled: {
    opacity: 0.7,
  },
  removeButtonText: {
    color: palette.danger,
    fontFamily: typography.bold,
    fontSize: 14,
  },
});
