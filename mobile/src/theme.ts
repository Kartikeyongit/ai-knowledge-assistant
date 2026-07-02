import { useColorScheme } from "react-native";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  primary: string;
  accent: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warningLight: string;
  warningText: string;
  aiBubble: string;
  aiIcon: string;
  userBubble: string;
  userIcon: string;
  inputBg: string;
  inputBorder: string;
  codeBg: string;
  codeBorder: string;
  codeText: string;
  blockquoteBg: string;
  blockquoteBorder: string;
  link: string;
  overlay: string;
}

const light: ThemeColors = {
  background: "#ffffff",
  surface: "#ffffff",
  surfaceAlt: "#f0f0f0",
  text: "#111111",
  textSecondary: "#595959",
  textTertiary: "#8c8c8c",
  border: "#e0e0e0",
  borderLight: "#eeeeee",
  primary: "#111111",
  accent: "#007AFF",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  success: "#16a34a",
  successLight: "#dcfce7",
  warningLight: "#fef3c7",
  warningText: "#92400e",
  aiBubble: "#f0f0f0",
  aiIcon: "#404040",
  userBubble: "#262626",
  userIcon: "#d4d4d4",
  inputBg: "#f8f8f8",
  inputBorder: "#d4d4d4",
  codeBg: "#f0f0f0",
  codeBorder: "#e0e0e0",
  codeText: "#6b21a8",
  blockquoteBg: "#f5f3ff",
  blockquoteBorder: "#6366f1",
  link: "#4f46e5",
  overlay: "#00000060",
};

const dark: ThemeColors = {
  background: "#0a0a0a",
  surface: "#141414",
  surfaceAlt: "#1f1f1f",
  text: "#f5f5f5",
  textSecondary: "#a3a3a3",
  textTertiary: "#737373",
  border: "#333333",
  borderLight: "#262626",
  primary: "#ffffff",
  accent: "#0A84FF",
  danger: "#ef4444",
  dangerLight: "#2a1010",
  success: "#22c55e",
  successLight: "#052e16",
  warningLight: "#422006",
  warningText: "#fbbf24",
  aiBubble: "#1f1f1f",
  aiIcon: "#e5e5e5",
  userBubble: "#333333",
  userIcon: "#333333",
  inputBg: "#0a0a0a",
  inputBorder: "#333333",
  codeBg: "#1a1a1a",
  codeBorder: "#333333",
  codeText: "#d8b4fe",
  blockquoteBg: "#14102a",
  blockquoteBorder: "#818cf8",
  link: "#818cf8",
  overlay: "#000000a0",
};

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? dark : light;
}