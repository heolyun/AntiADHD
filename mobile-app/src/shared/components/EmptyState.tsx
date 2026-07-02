import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 10,
    padding: 18,
    backgroundColor: colors.surface
  },
  text: {
    color: colors.muted,
    textAlign: 'center'
  }
});

