import { Platform } from "react-native";

export const palette = {
  primaryBackground: "#07110D",
  sidebarBackground: "#050505",
  cardBackground: "#101C17",
  cardBackgroundAlt: "#14231D",
  mainLightBackground: "#F6F8F7",
  primaryGreen: "#25D366",
  darkWhatsappGreen: "#075E54",
  accentTeal: "#00C2A8",
  textDark: "#111827",
  textWhite: "#FFFFFF",
  secondaryText: "#6B7280",
  border: "#E5E7EB",
  borderDark: "rgba(229, 231, 235, 0.12)",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#22C55E",
  overlay: "rgba(5, 5, 5, 0.7)",
} as const;

export const typography = {
  regular: Platform.select({
    android: "sans-serif",
    ios: "System",
    default: "sans-serif",
  }),
  medium: Platform.select({
    android: "sans-serif-medium",
    ios: "System",
    default: "sans-serif",
  }),
  semibold: Platform.select({
    android: "sans-serif-medium",
    ios: "System",
    default: "sans-serif",
  }),
  bold: Platform.select({
    android: "sans-serif-medium",
    ios: "System",
    default: "sans-serif",
  }),
  extrabold: Platform.select({
    android: "sans-serif-medium",
    ios: "System",
    default: "sans-serif",
  }),
} as const;

export const typeScale = {
  caption: 12,
  label: 14,
  bodySecondary: 14,
  body: 16,
  titleSmall: 20,
  titleMedium: 24,
  titleLarge: 32,
} as const;

