import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

interface SelectionCardProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SelectionCard({
  title,
  description,
  icon,
  selected = false,
  onPress,
  style,
}: SelectionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Ionicons
            name={icon}
            size={24}
            color={selected ? colors.white : colors.primary}
          />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text style={[styles.title, selected && styles.titleSelected]}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={colors.primary}
          style={styles.check}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f0f7f2",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: "#f0f7f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  titleSelected: {
    color: colors.primary,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  check: {
    marginLeft: spacing.sm,
  },
});
