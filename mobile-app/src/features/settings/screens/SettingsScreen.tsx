import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { useAuthContext } from '../../auth/context/AuthContext';
import { GuideTarget, useOnboarding } from '../../onboarding/context/OnboardingContext';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';

export function SettingsScreen() {
  const { user, changePassword, deleteAccount, logout } = useAuthContext();
  const { openGuide } = useOnboarding();
  const { isLoading, error, setError, run } = useAsyncAction();
  const [mode, setMode] = useState<'password' | 'delete' | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function closeEditor() {
    setMode(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  }

  async function submitPasswordChange() {
    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    const result = await run(() => changePassword(currentPassword, newPassword));
    if (result !== null) {
      closeEditor();
      Alert.alert('변경 완료', '비밀번호와 로그인 보안 정보가 갱신되었습니다.');
    }
  }

  function confirmDeletion() {
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }
    Alert.alert(
      '계정을 삭제할까요?',
      '일정, 루틴, 회고와 AI 작업 기록이 모두 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '완전히 삭제', style: 'destructive', onPress: () => run(() => deleteAccount(currentPassword)) }
      ]
    );
  }
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
      <View style={styles.securityCard}>
        <Text style={styles.sectionTitle}>계정 보안</Text>
        {mode === 'password' ? (
          <View style={styles.form}>
            <TextInput testID="settings-current-password" style={styles.input} placeholder="현재 비밀번호" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            <TextInput testID="settings-new-password" style={styles.input} placeholder="새 비밀번호 (8자 이상)" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput testID="settings-confirm-password" style={styles.input} placeholder="새 비밀번호 확인" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="비밀번호 변경" loading={isLoading} onPress={submitPasswordChange} />
            <Button title="취소" variant="secondary" onPress={closeEditor} />
          </View>
        ) : (
          <Button title="비밀번호 변경" variant="secondary" onPress={() => setMode('password')} />
        )}
      </View>
      <View style={styles.spacer} />
      <Button title="로그아웃" variant="danger" onPress={logout} />
      {mode === 'delete' ? (
        <View style={styles.deleteForm}>
          <Text style={styles.deleteNotice}>계정의 모든 데이터를 영구 삭제합니다.</Text>
          <TextInput testID="settings-delete-password" style={styles.input} placeholder="현재 비밀번호" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="계정 완전히 삭제" variant="danger" loading={isLoading} onPress={confirmDeletion} />
          <Button title="취소" variant="secondary" onPress={closeEditor} />
        </View>
      ) : (
        <Pressable onPress={() => { closeEditor(); setMode('delete'); }}>
          <Text style={styles.deleteLink}>회원 탈퇴</Text>
        </Pressable>
      )}
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
  spacer: { height: 10 },
  securityCard: { gap: 10, marginTop: 14 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  form: { gap: 9 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, backgroundColor: colors.surface },
  error: { color: colors.danger, fontWeight: '700' },
  deleteForm: { gap: 9, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  deleteNotice: { color: colors.danger, fontWeight: '700' },
  deleteLink: { color: colors.danger, textAlign: 'center', padding: 14, fontWeight: '800' }
});
