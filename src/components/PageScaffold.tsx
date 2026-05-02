import { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { getInitials } from "../utils/format";
import { palette, typography, typeScale } from "../theme/palette";

type PageScaffoldProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function PageScaffold({ title, subtitle, children }: PageScaffoldProps) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const isDesktop = width >= 1024;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingHorizontal: isDesktop ? 30 : 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.headerCard,
            {
              flexDirection: isDesktop ? "row" : "column",
              gap: isDesktop ? 20 : 14,
            },
          ]}
        >
          <View style={styles.titleWrap}>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
          </View>

          <View
            style={[
              styles.headerMeta,
              {
                alignSelf: isDesktop ? "center" : "stretch",
                justifyContent: isDesktop ? "flex-end" : "space-between",
              },
            ]}
          >
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: settings.botActive
                    ? "rgba(37, 211, 102, 0.14)"
                    : "rgba(239, 68, 68, 0.14)",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: settings.botActive
                      ? palette.primaryGreen
                      : palette.danger,
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {settings.botActive ? "Bot Active" : "Bot Inactive"}
              </Text>
            </View>

            <View style={styles.businessBadge}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user?.displayName, user?.email)}
                </Text>
              </View>
              <View>
                <Text style={styles.businessEmail}>
                  {user?.email || "Not signed in"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 96,
    gap: 14,
  },
  headerCard: {
    backgroundColor: palette.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderDark,
    padding: 16,
    justifyContent: "space-between",
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  pageTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: typeScale.titleSmall,
  },
  pageSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.medium,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  statusText: {
    color: palette.textWhite,
    fontFamily: typography.semibold,
    fontSize: typeScale.label,
  },
  businessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.darkWhatsappGreen,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  avatarText: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: typeScale.label,
  },
  businessEmail: {
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: typeScale.bodySecondary,
  },
});

