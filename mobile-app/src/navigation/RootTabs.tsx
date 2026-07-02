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
        options={{ title: 'Today', tabBarIcon: ({ focused }) => <TabIcon label="T" focused={focused} /> }}
      />
      <Tab.Screen
        name="WeeklySchedule"
        component={WeeklyScheduleScreen}
        options={{ title: 'Week', tabBarIcon: ({ focused }) => <TabIcon label="W" focused={focused} /> }}
      />
      <Tab.Screen
        name="MonthlyCalendar"
        component={MonthlyCalendarScreen}
        options={{ title: 'Month', tabBarIcon: ({ focused }) => <TabIcon label="M" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: ({ focused }) => <TabIcon label="S" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootTabs() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} options={{ title: 'Schedule Detail' }} />
      <Stack.Screen name="ScheduleEdit" component={ScheduleEditScreen} options={{ title: 'Edit Schedule', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

