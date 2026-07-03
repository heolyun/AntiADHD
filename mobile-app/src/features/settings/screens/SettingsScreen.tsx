import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { useAuthContext } from '../../auth/context/AuthContext';

export function SettingsScreen() {
  const { user, logout } = useAuthContext();
  const apiUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    Constants.expoConfig?.extra?.apiBaseUrl ||
    'http://localhost:8080/api';

  return (
    <Screen>
      <Header eyebrow="설정" title="내 정보" />
      <View style={styles.card}>
        <Text style={styles.label}>이름</Text>
        <Text style={styles.value}>{user?.name}</Text>
        <Text style={styles.label}>이메일</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>API 서버</Text>
        <Text style={styles.value}>{apiUrl}</Text>
      </View>
      <Button title="로그아웃" variant="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 14,
    gap: 5
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', marginTop: 6 },
  value: { color: colors.text, fontSize: 16, fontWeight: '800' }
});
