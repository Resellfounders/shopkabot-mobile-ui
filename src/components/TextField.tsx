import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { palette, typography, typeScale } from "../theme/palette";

type TextFieldProps = TextInputProps & {
  label: string;
  helper?: string;
};

export function TextField({ label, helper, style, ...props }: TextFieldProps) {
  const isMultiline = Boolean(props.multiline);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.36)"
        style={[styles.input, isMultiline && styles.inputMultiline, style]}
        {...props}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: palette.textWhite,
    fontFamily: typography.semibold,
    fontSize: typeScale.label,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardBackgroundAlt,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: palette.textWhite,
    fontFamily: typography.medium,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 13,
    textAlignVertical: "top",
  },
  helper: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: typography.medium,
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
});

