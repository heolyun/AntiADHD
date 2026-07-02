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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.logo}>AntiADHD</Text>
        <Text style={styles.title}>Plan your next block</Text>
        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Login" loading={isLoading} onPress={() => run(() => login({ email, password }))} />
        <Pressable onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>Create an account</Text>
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

