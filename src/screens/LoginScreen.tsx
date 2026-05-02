import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { signInWithGooglePopup } from "../services/firebase";
import { palette, typography } from "../theme/palette";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const { signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const isDesktop = width >= 1024;

  const googleConfig = useMemo(
    () => ({
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
    }),
    [],
  );

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest(googleConfig);
  const canLogin =
    Platform.OS === "web" ? !submitting : Boolean(request) && !submitting;

  useEffect(() => {
    const idToken =
      response?.type === "success" ? response.params.id_token : undefined;
    if (response && response.type !== "success") {
      setSubmitting(false);
      return;
    }

    if (!idToken) {
      return;
    }

    setSubmitting(true);
    signInWithGoogle(idToken)
      .catch((error) => {
        Alert.alert(
          "Login failed",
          error instanceof Error ? error.message : "Please try again.",
        );
      })
      .finally(() => setSubmitting(false));
  }, [response, signInWithGoogle]);

  const handleGoogleLogin = async () => {
    if (Platform.OS === "web") {
      try {
        setSubmitting(true);
        await signInWithGooglePopup();
      } catch (error) {
        Alert.alert(
          "Login failed",
          error instanceof Error ? error.message : "Unable to sign in with Google.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!googleConfig.androidClientId) {
      Alert.alert(
        "Missing Google client ID",
        "Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in your .env before testing Google login.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const result = await promptAsync();
      if (result.type !== "success") {
        setSubmitting(false);
      }
    } catch {
      Alert.alert("Login failed", "Unable to open Google sign in.");
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#040705", "#07110D", "#0A1713"]}
      style={styles.screen}
    >
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isDesktop ? 28 : 16, paddingVertical: isDesktop ? 40 : 24 },
        ]}
      >
        <View style={styles.maxWidth}>
          <View style={styles.heroSection}>
            <View style={[styles.loginCard, isDesktop && styles.loginCardDesktop]}>
              <View style={styles.kickerRow}>
                <View style={styles.logoWrap}>
                  <Ionicons
                    name="logo-whatsapp"
                    size={28}
                    color={palette.textDark}
                  />
                </View>
                <View style={styles.kickerCopy}>
                  <Text style={styles.kickerLabel}>ShopKaBot</Text>
                  <Text style={styles.kickerText}>
                    WhatsApp Business automation made simple
                  </Text>
                </View>
              </View>

              <Text style={styles.signInEyebrow}>Get started</Text>

              <Text style={styles.heroTitle}>
                Continue with Google
              </Text>

              <Text style={styles.heroSubtitle}>
                Access your ShopKaBot workspace to train reply rules, test journeys,
                and keep WhatsApp support responsive from one simple setup.
              </Text>

              <View style={styles.heroBulletStack}>
                {[
                  "Train replies in minutes",
                  "Test before you go live",
                  "Keep customer chats moving",
                ].map((item) => (
                  <View key={item} style={styles.heroBulletRow}>
                    <View style={styles.heroBulletIcon}>
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={palette.textDark}
                      />
                    </View>
                    <Text style={styles.heroBulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                disabled={!canLogin}
                onPress={handleGoogleLogin}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.googleButtonPressed,
                  !canLogin && styles.googleButtonDisabled,
                ]}
              >
                <Ionicons name="logo-google" size={20} color={palette.textWhite} />
                <Text style={styles.googleButtonText}>
                  {submitting ? "Signing in..." : "Sign in with Google"}
                </Text>
              </Pressable>

              <View style={styles.signInMeta}>
                <View style={styles.metaChip}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={14}
                    color={palette.primaryGreen}
                  />
                  <Text style={styles.metaChipText}>Secure login</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color={palette.primaryGreen}
                  />
                  <Text style={styles.metaChipText}>Minimal setup</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  orbTop: {
    position: "absolute",
    top: 40,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(37,211,102,0.14)",
  },
  orbBottom: {
    position: "absolute",
    bottom: 120,
    left: -90,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(0,194,168,0.12)",
  },
  content: {
    alignItems: "center",
    gap: 18,
  },
  maxWidth: {
    width: "100%",
    maxWidth: 1180,
  },
  heroSection: {
    width: "100%",
    alignItems: "center",
  },
  loginCard: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: "rgba(12,23,18,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 18,
    width: "100%",
  },
  loginCardDesktop: {
    maxWidth: 760,
    padding: 32,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  kickerCopy: {
    flex: 1,
    gap: 3,
  },
  kickerLabel: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 20,
  },
  kickerText: {
    color: "rgba(255,255,255,0.66)",
    fontFamily: typography.medium,
    fontSize: 13,
  },
  heroTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 15,
    lineHeight: 24,
  },
  heroBulletStack: {
    gap: 10,
    paddingTop: 4,
  },
  heroBulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroBulletIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen,
  },
  heroBulletText: {
    flex: 1,
    color: palette.textWhite,
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 21,
  },
  signInEyebrow: {
    color: palette.primaryGreen,
    fontFamily: typography.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  googleButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#DB4437",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  googleButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  googleButtonDisabled: {
    opacity: 0.65,
  },
  googleButtonText: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 16,
  },
  signInMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metaChipText: {
    color: palette.textWhite,
    fontFamily: typography.semibold,
    fontSize: 12,
  },
});
