import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppDrawerContent } from "../components/AppDrawerContent";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { palette } from "../theme/palette";
import { ConnectWhatsAppScreen } from "../screens/ConnectWhatsAppScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DisableAiReplyScreen } from "../screens/DisableAiReplyScreen";
import { HelpAboutScreen } from "../screens/HelpAboutScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ReplyHistoryScreen } from "../screens/ReplyHistoryScreen";
import { RulesScreen } from "../screens/RulesScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { TestTheBotScreen } from "../screens/TestRulesScreen";

const Drawer = createDrawerNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.primaryBackground,
    card: palette.sidebarBackground,
    border: palette.borderDark,
    text: palette.textWhite,
    primary: palette.primaryGreen,
  },
};

export function AppNavigator() {
  const { width } = useWindowDimensions();
  const { isReady, user } = useAuth();
  const { isLoaded } = useAppSettings();
  const isDesktop = width >= 1024;

  if (!isReady || !isLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={palette.primaryGreen} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Drawer.Navigator
        initialRouteName="Rules"
        drawerContent={(props) => <AppDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: palette.primaryBackground,
          },
          headerTintColor: palette.textWhite,
          headerShadowVisible: false,
          drawerType: isDesktop ? "permanent" : "front",
          drawerStyle: {
            width: 280,
            backgroundColor: palette.sidebarBackground,
          },
          overlayColor: palette.overlay,
          sceneStyle: {
            backgroundColor: palette.primaryBackground,
          },
          headerLeft: isDesktop
            ? undefined
            : () => (
                <Pressable
                  onPress={() => navigation.toggleDrawer()}
                  style={styles.menuButton}
                >
                  <Ionicons name="menu" size={24} color={palette.textWhite} />
                </Pressable>
              ),
          headerTitle: "",
        })}
      >
        <Drawer.Screen name="Dashboard" component={DashboardScreen} />
        <Drawer.Screen
          name="Rules"
          component={RulesScreen}
          options={{ drawerLabel: "Train The Bot" }}
        />
        <Drawer.Screen
          name="Test The Bot"
          component={TestTheBotScreen}
        />
        <Drawer.Screen name="Reply History" component={ReplyHistoryScreen} />
        <Drawer.Screen name="Disable AI Reply" component={DisableAiReplyScreen} />
        <Drawer.Screen name="Subscription" component={SubscriptionScreen} />
        <Drawer.Screen
          name="Connect WhatsApp"
          component={ConnectWhatsAppScreen}
        />
        <Drawer.Screen
          name="Help / About"
          component={HelpAboutScreen}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.primaryBackground,
  },
  menuButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.cardBackgroundAlt,
  },
});

