import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.textBox}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18
  },
  textBox: {
    flex: 1
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  }
});
