import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { useAuthContext } from '../context/AuthContext';
import type { AuthStackParamList } from '../../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { signup } = useAuthContext();
  const { isLoading, error, run } = useAsyncAction();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      return run(async () => {
        throw new Error('이름, 이메일, 비밀번호를 입력해주세요.');
      });
    }
    if (password.length < 8) {
      return run(async () => {
        throw new Error('비밀번호는 8자 이상이어야 합니다.');
      });
    }

    return run(() => signup({ name: trimmedName, email: trimmedEmail, password }));
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.logo}>AtiADHD</Text>
        <Text style={styles.title}>계정 만들기</Text>
        <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="이메일" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="비밀번호 8자 이상" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="회원가입" loading={isLoading} onPress={submit} />
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>이미 계정이 있어요</Text>
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
