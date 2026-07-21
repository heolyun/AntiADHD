import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { useAuthContext } from '../../auth/context/AuthContext';
import { GuideTarget, useOnboarding } from '../../onboarding/context/OnboardingContext';

export function SettingsScreen() {
  const { user, logout } = useAuthContext();
  const { openGuide } = useOnboarding();
  return (
    <Screen>
      <Header eyebrow="설정" title="내 정보" />
      <View style={styles.card}>
        <Text style={styles.label}>이름</Text>
        <Text style={styles.value}>{user?.name}</Text>
        <Text style={styles.label}>이메일</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>
      <GuideTarget id="settings-guide">
        <Button title="사용 가이드 다시 보기" variant="secondary" onPress={openGuide} />
      </GuideTarget>
      <View style={styles.spacer} />
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
  value: { color: colors.text, fontSize: 16, fontWeight: '800' },
  spacer: { height: 10 }
});
