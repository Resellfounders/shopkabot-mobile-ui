import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { PageScaffold } from "../components/PageScaffold";
import { SectionCard } from "../components/SectionCard";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { palette, typography } from "../theme/palette";

export function BusinessSettingsScreen() {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const hasWhatsAppConnection = !!form.whatsappConnection?.phoneNumberId;
  const isBotActive = hasWhatsAppConnection && form.botActive;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        apiBaseUrl: form.apiBaseUrl.trim(),
        businessId: form.businessId.trim(),
        businessName: form.businessName.trim() || "ShopKaBot Business",
      });
      Alert.alert("Saved", "Business settings updated for the mobile app.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageScaffold
      title="Business Settings"
      subtitle="Manage connection and bot status."
    >
      <SectionCard title="Settings">
        <TextField
          label="Business name"
          value={form.businessName}
          onChangeText={(value) => setForm((current) => ({ ...current, businessName: value }))}
          placeholder="ShopKaBot Business"
        />

        <TextField
          label="businessId"
          value={form.businessId}
          onChangeText={(value) => setForm((current) => ({ ...current, businessId: value }))}
          placeholder="biz_123"
          helper="Leave blank if you want rules saved with a null businessId."
        />

        <TextField
          label="API base URL"
          value={form.apiBaseUrl}
          onChangeText={(value) => setForm((current) => ({ ...current, apiBaseUrl: value }))}
          placeholder="http://10.0.2.2:8000"
        />

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Bot active</Text>
            <Text style={styles.switchText}>
              {hasWhatsAppConnection
                ? "Turn the bot on or off for this connected WhatsApp Business."
                : "Connect WhatsApp Business first to activate the bot."}
            </Text>
          </View>
          <Switch
            value={isBotActive}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, botActive: value }))
            }
            disabled={!hasWhatsAppConnection}
            thumbColor={isBotActive ? palette.primaryGreen : "#CBD5E1"}
            trackColor={{ false: "#475569", true: "#064E3B" }}
          />
        </View>

        <Pressable
          onPress={() => void handleSave()}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Settings"}</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Current Status">
        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>gmailId</Text>
          <Text style={styles.scopeValue}>{user?.email || "Not available"}</Text>
        </View>
        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>businessId</Text>
          <Text style={styles.scopeValue}>{form.businessId || "null"}</Text>
        </View>
        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>API URL</Text>
          <Text style={styles.scopeValue}>{form.apiBaseUrl}</Text>
        </View>
        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>Bot status</Text>
          <Text
            style={[
              styles.scopeValue,
              isBotActive ? styles.statusActiveText : styles.statusInactiveText,
            ]}
          >
            {isBotActive ? "Active" : "Inactive"}
          </Text>
        </View>
        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>WhatsApp Business</Text>
          <Text style={styles.scopeValue}>
            {form.whatsappConnection?.phoneNumberId
              ? `Connected (${form.whatsappConnection.phoneNumberId})`
              : "Not connected"}
          </Text>
        </View>

        <Pressable
          onPress={() => void logout()}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </Pressable>
      </SectionCard>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    borderRadius: 16,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    padding: 14,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  switchText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 16,
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    marginTop: 4,
  },
  logoutButtonText: {
    color: palette.danger,
    fontFamily: typography.extrabold,
    fontSize: 14,
  },
  scopeCard: {
    borderRadius: 16,
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
    padding: 14,
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
  statusActiveText: {
    color: palette.primaryGreen,
  },
  statusInactiveText: {
    color: palette.warning,
  },
});

