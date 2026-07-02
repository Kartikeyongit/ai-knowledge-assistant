import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme";

type Mode = "rag" | "agent";

interface ModeSelectorProps {
  current: Mode;
  onChange: (mode: Mode) => void;
}

const modes: Mode[] = ["rag", "agent"];

export function ModeSelector({ current, onChange }: ModeSelectorProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      {modes.map((m, index) => (
        <TouchableOpacity
          key={m}
          onPress={() => onChange(m)}
          style={[
            styles.btn,
            index > 0 && styles.btnSpacing,
            { backgroundColor: current === m ? colors.primary : "transparent" },
          ]}
          accessibilityLabel={`${m.toUpperCase()} mode${current === m ? ", active" : ""}`}
          accessibilityRole="button"
          accessibilityState={{ selected: current === m }}
        >
          <Text
            style={[
              styles.text,
              { color: current === m ? colors.background : colors.textSecondary },
            ]}
          >
            {m === "rag" ? "RAG" : "Agent"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center" },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, minWidth: 52, minHeight: 40, alignItems: "center", justifyContent: "center" },
  btnSpacing: { marginLeft: 8 },
  text: { fontSize: 13, fontWeight: "700" },
});
