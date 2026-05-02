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

const GRAPH_API_VERSION = "v24.0";

export type NativeMetaSignupBridgeMessage =
  | {
      type: "sdk_loaded";
    }
  | {
      type: "sdk_error" | "signup_error";
      message: string;
    }
  | {
      type: "signup_event";
      payload: {
        type?: string;
        event?: string;
        data?: Record<string, unknown>;
      };
    }
  | {
      type: "login_callback";
      hasAuthResponse: boolean;
      code?: string;
    };

type NativeMetaSignupModalProps = {
  visible: boolean;
  appId: string;
  configId: string;
  onClose: () => void;
  onBridgeMessage: (message: NativeMetaSignupBridgeMessage) => void;
};

function escapeForSingleQuotedJs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildEmbeddedSignupHtml(appId: string, configId: string) {
  const escapedAppId = escapeForSingleQuotedJs(appId);
  const escapedConfigId = escapeForSingleQuotedJs(configId);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
    />
    <title>ShopKaBot WhatsApp Signup</title>
    <style>
      :root {
        color-scheme: dark;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background:
          radial-gradient(circle at top, rgba(37, 211, 102, 0.16), transparent 42%),
          linear-gradient(180deg, #07110d 0%, #0f1f18 100%);
        color: #f8fafc;
      }

      .shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 18px 32px;
      }

      .card {
        width: 100%;
        max-width: 420px;
        border-radius: 24px;
        padding: 24px 20px;
        background: rgba(7, 17, 13, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
      }

      .badge {
        width: 52px;
        height: 52px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        background: rgba(37, 211, 102, 0.18);
        font-size: 22px;
        font-weight: 700;
      }

      h1 {
        margin: 16px 0 8px;
        font-size: 24px;
        line-height: 1.2;
      }

      p {
        margin: 0;
        color: rgba(248, 250, 252, 0.76);
        font-size: 14px;
        line-height: 1.6;
      }

      .status {
        margin-top: 16px;
        min-height: 20px;
        font-size: 13px;
        color: rgba(248, 250, 252, 0.72);
      }

      button {
        width: 100%;
        margin-top: 20px;
        min-height: 52px;
        border: 0;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        background: #1877f2;
        color: #fff;
      }

      button:disabled {
        opacity: 0.7;
        cursor: wait;
      }

      .steps {
        margin-top: 18px;
        padding: 16px;
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.14);
      }

      .steps ol {
        margin: 0;
        padding-left: 18px;
      }

      .steps li {
        margin-top: 8px;
        color: rgba(248, 250, 252, 0.82);
        font-size: 14px;
        line-height: 1.5;
      }

      .steps li:first-child {
        margin-top: 0;
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">
        <div class="badge">WA</div>
        <h1>Connect WhatsApp Business</h1>
        <p>
          Continue with Facebook, choose the WhatsApp Business account you want,
          and finish the embedded signup flow.
        </p>
        <div id="status" class="status">Loading Facebook SDK...</div>
        <button id="startButton" type="button" disabled>
          Login with Facebook
        </button>
        <div class="steps">
          <ol>
            <li>Sign in with your Facebook account.</li>
            <li>Select or create your WhatsApp Business account.</li>
            <li>Choose the phone number you want to connect.</li>
            <li>Return to ShopKaBot after the flow finishes.</li>
          </ol>
        </div>
      </div>
    </div>

    <script>
      (function () {
        var signupState = {};
        var statusEl = document.getElementById('status');
        var startButton = document.getElementById('startButton');

        function updateStatus(message) {
          if (statusEl) {
            statusEl.textContent = message;
          }
        }

        function postToNative(payload) {
          if (
            window.ReactNativeWebView &&
            typeof window.ReactNativeWebView.postMessage === 'function'
          ) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        }

        function safeParseMessage(data) {
          if (typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch (error) {
              return null;
            }
          }

          if (typeof data === 'object' && data !== null) {
            return data;
          }

          return null;
        }

        function handleSignupEvent(message) {
          if (!message || message.type !== 'WA_EMBEDDED_SIGNUP') {
            return;
          }

          if (message.event) {
            signupState.event = message.event;
          }

          if (message.data && message.data.waba_id) {
            signupState.waba_id = message.data.waba_id;
          }

          if (message.data && message.data.phone_number_id) {
            signupState.phone_number_id = message.data.phone_number_id;
          }

          if (message.data && message.data.display_phone_number) {
            signupState.phone_number = message.data.display_phone_number;
          } else if (message.data && message.data.phone_number) {
            signupState.phone_number = message.data.phone_number;
          }

          if (message.data && message.data.display_name) {
            signupState.display_name = message.data.display_name;
          }

          postToNative({
            type: 'signup_event',
            payload: {
              type: message.type,
              event: message.event,
              data: Object.assign({}, message.data || {}, signupState),
            },
          });
        }

        function launchSignup() {
          if (!window.FB) {
            postToNative({
              type: 'signup_error',
              message: 'Facebook SDK not loaded yet.',
            });
            return;
          }

          signupState = {};
          startButton.disabled = true;
          updateStatus('Opening embedded signup...');

          window.FB.login(
            function (response) {
              postToNative({
                type: 'login_callback',
                hasAuthResponse: Boolean(response && response.authResponse),
                code:
                  response && response.authResponse
                    ? response.authResponse.code
                    : undefined,
              });

              if (!response || !response.authResponse) {
                updateStatus('Signup was cancelled or could not be completed.');
                startButton.disabled = false;
                return;
              }

              updateStatus('Finishing connection...');
            },
            {
              config_id: '${escapedConfigId}',
              response_type: 'code',
              override_default_response_type: true,
              extras: {
                setup: {},
                featureType: 'whatsapp_business_app_onboarding',
                sessionInfoVersion: '3',
                version: 'v4',
              },
            },
          );
        }

        window.addEventListener('message', function (event) {
          if (
            event.origin !== 'https://www.facebook.com' &&
            event.origin !== 'https://web.facebook.com' &&
            event.origin !== 'https://business.facebook.com'
          ) {
            return;
          }

          var parsed = safeParseMessage(event.data);
          if (!parsed) {
            return;
          }

          handleSignupEvent(parsed);

          if (
            parsed.event &&
            (parsed.event.indexOf('CANCEL') === 0 ||
              parsed.event.indexOf('ERROR') === 0 ||
              parsed.event.indexOf('FAIL') >= 0)
          ) {
            updateStatus('Signup did not finish. Please try again.');
            startButton.disabled = false;
          }
        });

        startButton.addEventListener('click', launchSignup);

        window.fbAsyncInit = function () {
          try {
            window.FB.init({
              appId: '${escapedAppId}',
              autoLogAppEvents: true,
              cookie: true,
              xfbml: true,
              version: '${GRAPH_API_VERSION}',
            });

            updateStatus('Ready to continue with Facebook.');
            startButton.disabled = false;
            postToNative({ type: 'sdk_loaded' });
          } catch (error) {
            postToNative({
              type: 'sdk_error',
              message:
                error && error.message
                  ? error.message
                  : 'Facebook SDK failed to initialize.',
            });
            updateStatus('Facebook SDK failed to initialize.');
          }
        };

        var script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.onerror = function () {
          postToNative({
            type: 'sdk_error',
            message: 'Unable to load the Facebook SDK.',
          });
          updateStatus('Unable to load the Facebook SDK.');
        };
        document.body.appendChild(script);
      })();
    </script>
  </body>
</html>`;
}

export function NativeMetaSignupModal({
  visible,
  appId,
  configId,
  onClose,
  onBridgeMessage,
}: NativeMetaSignupModalProps) {
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed = JSON.parse(event.nativeEvent.data) as NativeMetaSignupBridgeMessage;
        onBridgeMessage(parsed);
      } catch {
        onBridgeMessage({
          type: "signup_error",
          message: "Unable to read the Meta signup response.",
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
            <Text style={styles.headerTitle}>Meta Embedded Signup</Text>
            <Text style={styles.headerText}>
              Complete the Facebook and WhatsApp Business steps here, then return
              to ShopKaBot automatically.
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={palette.textWhite} />
          </Pressable>
        </View>

        <View style={styles.webViewCard}>
          <WebView
            originWhitelist={["*"]}
            source={{ html: buildEmbeddedSignupHtml(appId, configId) }}
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
                <Text style={styles.loadingText}>Loading Meta signup...</Text>
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
