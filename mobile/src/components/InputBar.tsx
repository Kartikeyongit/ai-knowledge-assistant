import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme";

interface InputBarProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading: boolean;
  streaming?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  insets?: { bottom: number };
}

export function InputBar({ value, onChange, onSend, onStop, loading, streaming, placeholder, autoFocus, onFocus, onBlur, insets }: InputBarProps) {
  const colors = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets?.bottom ?? 0 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || "Ask a question..."}
          placeholderTextColor={colors.textTertiary}
          editable={!loading && !streaming}
          multiline
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={onSend}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      {streaming && onStop ? (
        <TouchableOpacity
          style={[styles.stopButton, { backgroundColor: colors.danger }]}
          onPress={onStop}
          accessibilityLabel="Stop streaming"
          accessibilityRole="button"
        >
          <View style={[styles.stopIcon, { backgroundColor: colors.background }]} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }, (!value.trim() || loading) && { opacity: 0.5 }]}
          onPress={onSend}
          disabled={!value.trim() || loading}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          {loading ? <ActivityIndicator color={colors.background} size="small" /> : <Text style={[styles.sendText, { color: colors.background }]}>Send</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 1, alignItems: "flex-end",
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, maxHeight: 110, marginRight: 10, minHeight: 48,
  },
  sendButton: { width: 56, height: 44, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sendText: { fontWeight: "600" },
  stopButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  stopIcon: { width: 14, height: 14, borderRadius: 2 },
});
