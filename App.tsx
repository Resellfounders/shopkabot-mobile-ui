import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { AppSettingsProvider } from "./src/context/AppSettingsContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { palette } from "./src/theme/palette";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppSettingsProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </AppSettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
});
