import { createNavigationContainerRef, NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuthContext } from './src/features/auth/context/AuthContext';
import { SplashScreen } from './src/features/auth/screens/SplashScreen';
import { AuthStack } from './src/navigation/AuthStack';
import { RootTabs } from './src/navigation/RootTabs';
import type { RootTabParamList, ScheduleStackParamList } from './src/types/navigation';
import { AppErrorBoundary } from './src/shared/components/AppErrorBoundary';
import { ScheduleSyncManager } from './src/features/schedules/offline/ScheduleSyncManager';

const navigationRef = createNavigationContainerRef<ScheduleStackParamList>();
const linking: LinkingOptions<ScheduleStackParamList> = {
  prefixes: ['atiadhd://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'today'
        }
      },
      ScheduleEdit: 'schedule/new'
    }
  }
};

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
    <NavigationContainer ref={navigationRef} linking={linking}>
      {token ? (
        <>
          <ScheduleSyncManager />
          <RootTabs navigateToGuideTab={navigateToGuideTab} />
        </>
      ) : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppErrorBoundary>
          <StatusBar style="dark" />
          <AppNavigator />
        </AppErrorBoundary>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
