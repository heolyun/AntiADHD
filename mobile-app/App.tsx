import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuthContext } from './src/features/auth/context/AuthContext';
import { SplashScreen } from './src/features/auth/screens/SplashScreen';
import { AuthStack } from './src/navigation/AuthStack';
import { RootTabs } from './src/navigation/RootTabs';
import type { RootTabParamList, ScheduleStackParamList } from './src/types/navigation';

const navigationRef = createNavigationContainerRef<ScheduleStackParamList>();

function navigateToGuideTab(route: keyof RootTabParamList) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('MainTabs', { screen: route });
  }
}

function AppNavigator() {
  const { isBootstrapping, token } = useAuthContext();

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {token ? <RootTabs navigateToGuideTab={navigateToGuideTab} /> : <AuthStack />}
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
