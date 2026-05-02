import { useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  WebView,
  WebViewMessageEvent,
} from "react-native-webview";

import { palette, typography } from "../theme/palette";

export type HostedWhatsAppOnboardingMessage =
  | {
      type: "signup_ready";
    }
  | {
      type: "signup_success";
      payload: {
        wabaId: string;
        phoneNumberId: string;
        eventType: string;
        displayName?: string;
        phoneNumber?: string;
        synced: boolean;
        settingsId?: string;
        businessSettings?: {
          name?: string;
          fullPhoneNumber?: string;
          phoneNumberId?: string;
          businessId?: string;
          replyFlowType?: string;
        };
      };
    }
  | {
      type: "signup_cancelled" | "signup_error";
      message: string;
    };

type HostedWhatsAppOnboardingModalProps = {
  visible: boolean;
  onboardingUrl: string;
  onClose: () => void;
  onBridgeMessage: (message: HostedWhatsAppOnboardingMessage) => void;
};

export function HostedWhatsAppOnboardingModal({
  visible,
  onboardingUrl,
  onClose,
  onBridgeMessage,
}: HostedWhatsAppOnboardingModalProps) {
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed = JSON.parse(
          event.nativeEvent.data,
        ) as HostedWhatsAppOnboardingMessage;
        onBridgeMessage(parsed);
      } catch {
        onBridgeMessage({
          type: "signup_error",
          message: "Unable to read the WhatsApp onboarding response.",
        });
      }
    },
    [onBridgeMessage],
  );

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>WhatsApp Onboarding</Text>
            <Text style={styles.headerText}>
              Complete the hosted Meta signup flow here. Once it finishes, the app
              will store the connected business for this signed-in user.
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={palette.textWhite} />
          </Pressable>
        </View>

        <View style={styles.webViewCard}>
          <WebView
            originWhitelist={["*"]}
            source={{ uri: onboardingUrl }}
            onMessage={handleMessage}
            javaScriptEnabled
            javaScriptCanOpenWindowsAutomatically
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingState}>
                <ActivityIndicator color={palette.primaryGreen} />
                <Text style={styles.loadingText}>Loading WhatsApp onboarding...</Text>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: palette.textWhite,
    fontFamily: typography.extrabold,
    fontSize: 22,
  },
  headerText: {
    color: "rgba(255,255,255,0.74)",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.cardBackgroundAlt,
    borderWidth: 1,
    borderColor: palette.borderDark,
  },
  webViewCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: "#07110D",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: palette.primaryBackground,
  },
  loadingText: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.medium,
    fontSize: 14,
  },
});
