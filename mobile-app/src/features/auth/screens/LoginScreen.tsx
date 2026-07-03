import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { useAuthContext } from '../context/AuthContext';
import type { AuthStackParamList } from '../../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuthContext();
  const { isLoading, error, run } = useAsyncAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return run(async () => {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      });
    }

    return run(() => login({ email: trimmedEmail, password }));
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.logo}>AntiADHD</Text>
        <Text style={styles.title}>오늘의 시간을 정리하세요</Text>
        <TextInput style={styles.input} placeholder="이메일" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="로그인" loading={isLoading} onPress={submit} />
        <Pressable onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>처음이라면 회원가입</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: colors.background },
  panel: { gap: 12 },
  logo: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginBottom: 12 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface
  },
  error: { color: colors.danger, fontWeight: '700' },
  link: { textAlign: 'center', color: colors.primary, fontWeight: '800', padding: 8 }
});
