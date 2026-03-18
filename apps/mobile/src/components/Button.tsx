import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.outlineText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: { backgroundColor: "#1a1a2e" },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1a1a2e",
  },
  disabled: { opacity: 0.4 },
  text: { fontSize: 16, fontWeight: "600" },
  primaryText: { color: "#fff" },
  outlineText: { color: "#1a1a2e" },
  disabledText: {},
});
