import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../shared/constants/theme';
import { HomeScreen } from '../features/schedules/screens/HomeScreen';
import { MonthlyCalendarScreen } from '../features/schedules/screens/MonthlyCalendarScreen';
import { ScheduleDetailScreen } from '../features/schedules/screens/ScheduleDetailScreen';
import { ScheduleEditScreen } from '../features/schedules/screens/ScheduleEditScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { WeeklyScheduleScreen } from '../features/schedules/screens/WeeklyScheduleScreen';
import type { RootTabParamList, ScheduleStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<ScheduleStackParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ color: focused ? colors.primary : colors.muted, fontSize: 15, fontWeight: '900' }}>{label}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800'
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '오늘', tabBarIcon: ({ focused }) => <TabIcon label="오늘" focused={focused} /> }}
      />
      <Tab.Screen
        name="WeeklySchedule"
        component={WeeklyScheduleScreen}
        options={{ title: '주간', tabBarIcon: ({ focused }) => <TabIcon label="주" focused={focused} /> }}
      />
      <Tab.Screen
        name="MonthlyCalendar"
        component={MonthlyCalendarScreen}
        options={{ title: '월간', tabBarIcon: ({ focused }) => <TabIcon label="월" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '설정', tabBarIcon: ({ focused }) => <TabIcon label="설정" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootTabs() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} options={{ title: '일정 상세' }} />
      <Stack.Screen name="ScheduleEdit" component={ScheduleEditScreen} options={{ title: '일정 편집', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
