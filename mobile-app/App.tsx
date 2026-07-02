import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuthContext } from './src/features/auth/context/AuthContext';
import { SplashScreen } from './src/features/auth/screens/SplashScreen';
import { AuthStack } from './src/navigation/AuthStack';
import { RootTabs } from './src/navigation/RootTabs';

function AppNavigator() {
  const { isBootstrapping, token } = useAuthContext();

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {token ? <RootTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}
