import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  nativeID?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  { title, onPress, variant = 'primary', disabled, loading, nativeID, onLayout },
  ref
) {
  return (
    <Pressable
      ref={ref}
      nativeID={nativeID}
      onPress={onPress}
      onLayout={onLayout}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || disabled || loading) && styles.pressed
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.text} /> : (
        <Text style={[styles.text, variant === 'primary' && styles.primaryText]}>{title}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.surface,
    borderColor: colors.danger
  },
  pressed: {
    opacity: 0.72
  },
  text: {
    color: colors.text,
    fontWeight: '800'
  },
  primaryText: {
    color: '#fff'
  }
});

