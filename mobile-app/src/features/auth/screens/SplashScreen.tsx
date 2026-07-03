import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/constants/theme';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Text style={styles.markText}>A</Text>
      </View>
      <Text style={styles.title}>AntiADHD</Text>
      <Text style={styles.subtitle}>타임블록 일정관리</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: 16
  },
  markText: { color: '#fff', fontSize: 34, fontWeight: '900' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.muted, marginTop: 6, fontWeight: '700' }
});
