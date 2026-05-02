import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { palette, typography, typeScale } from "../theme/palette";

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "grid-outline",
  Rules: "flash-outline",
  "Train The Bot": "sparkles-outline",
  "Test The Bot": "flask-outline",
  "Reply History": "time-outline",
  "Disable AI Reply": "remove-circle-outline",
  Subscription: "card-outline",
  "Connect WhatsApp": "logo-whatsapp",
  "Help / About": "help-circle-outline",
};

const salesUrl =
  process.env.EXPO_PUBLIC_CONTACT_BOOKING_URL ||
  process.env.EXPO_PUBLIC_CONTACT_WHATSAPP_URL ||
  "";

export function AppDrawerContent({
  state,
  navigation,
  descriptors,
}: DrawerContentComponentProps) {
  const { logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleTalkToSales = async () => {
    if (!salesUrl) {
      navigation.navigate("Subscription");
      return;
    }

    const supported = await Linking.canOpenURL(salesUrl);
    if (!supported) {
      Alert.alert("Unable to open sales link", salesUrl);
      return;
    }

    await Linking.openURL(salesUrl);
  };

  const performSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert(
        "Sign out failed",
        error instanceof Error
          ? error.message
          : "Unable to sign out right now.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      const shouldSignOut = window.confirm(
        "Do you want to sign out of ShopKaBot?",
      );
      if (!shouldSignOut) {
        return;
      }

      void performSignOut();
      return;
    }

    Alert.alert("Sign out", "Do you want to sign out of ShopKaBot?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView
      scrollEnabled={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topBlock}>
        <LinearGradient
          colors={["#0D1C16", "#07110D"]}
          style={styles.brandCard}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>ShopKaBot</Text>
            <Text style={styles.brandSubtitle}>
              WhatsApp Business Automation
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.menuList}>
          {state.routes.map((route) => {
            const descriptor = descriptors[route.key];
            const label =
              descriptor.options.drawerLabel?.toString() ||
              descriptor.options.title ||
              route.name;
            const focused = state.routes[state.index]?.key === route.key;

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[styles.menuItem, focused && styles.menuItemActive]}
              >
                <Ionicons
                  name={iconMap[label] || "ellipse-outline"}
                  size={20}
                  color={focused ? palette.textWhite : "rgba(255,255,255,0.64)"}
                />
                <Text
                  style={[styles.menuLabel, focused && styles.menuLabelActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <LinearGradient
        colors={["rgba(0,194,168,0.2)", "rgba(37,211,102,0.12)"]}
        style={styles.upgradeCard}
      >
        <Text style={styles.upgradeTitle}>Upgrade - Agentic AI version</Text>
        <Text style={styles.upgradeCopy}>
          Advanced workflows and custom integrations for your business.
        </Text>
        <Pressable
          style={styles.upgradeButton}
          onPress={() => void handleTalkToSales()}
        >
          <Text style={styles.upgradeButtonText}>Talk To Sales</Text>
        </Pressable>

        <Pressable
          style={[
            styles.signOutButton,
            isSigningOut && styles.signOutButtonDisabled,
          ]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={palette.danger}
          />
          <Text style={styles.signOutButtonText}>
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </Text>
        </Pressable>
      </LinearGradient>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: palette.sidebarBackground,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  topBlock: {
    gap: 16,
  },
  brandCard: {
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  brandCopy: {
    gap: 4,
  },
  brandTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: typeScale.titleSmall,
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.66)",
    fontFamily: typography.medium,
    fontSize: typeScale.bodySecondary,
  },
  menuList: {
    gap: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemActive: {
    backgroundColor: "rgba(37,211,102,0.2)",
    borderLeftWidth: 3,
    borderLeftColor: palette.primaryGreen,
  },
  menuLabel: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: typography.semibold,
    fontSize: typeScale.label,
  },
  menuLabelActive: {
    color: palette.textWhite,
  },
  upgradeCard: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  upgradeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(7,17,13,0.4)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.18)",
  },
  upgradeBadgeText: {
    color: palette.primaryGreen,
    fontFamily: typography.bold,
    fontSize: typeScale.caption,
  },
  upgradeTitle: {
    color: palette.textWhite,
    fontFamily: typography.bold,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
  upgradeCopy: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: typeScale.bodySecondary,
    lineHeight: 22,
  },
  upgradeButton: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: palette.textWhite,
    paddingVertical: 12,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: palette.textDark,
    fontFamily: typography.extrabold,
    fontSize: typeScale.label,
  },
  signOutButton: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.24)",
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutButtonText: {
    color: palette.danger,
    fontFamily: typography.extrabold,
    fontSize: typeScale.label,
  },
});
