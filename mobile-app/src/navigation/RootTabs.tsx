import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { colors } from '../shared/constants/theme';
import { HomeScreen } from '../features/schedules/screens/HomeScreen';
import { MonthlyCalendarScreen } from '../features/schedules/screens/MonthlyCalendarScreen';
import { ScheduleDetailScreen } from '../features/schedules/screens/ScheduleDetailScreen';
import { ScheduleEditScreen } from '../features/schedules/screens/ScheduleEditScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { WeeklyScheduleScreen } from '../features/schedules/screens/WeeklyScheduleScreen';
import { ProductivityScreen } from '../features/productivity/screens/ProductivityScreen';
import { FocusModeScreen } from '../features/focus/screens/FocusModeScreen';
import { CategoryTagManagerScreen } from '../features/categories/screens/CategoryTagManagerScreen';
import { DailyReviewScreen } from '../features/reviews/screens/DailyReviewScreen';
import { GoalManagerScreen } from '../features/goals/screens/GoalManagerScreen';
import { RoutineManagerScreen } from '../features/routines/screens/RoutineManagerScreen';
import type { RootTabParamList, ScheduleStackParamList } from '../types/navigation';
import { useAuthContext } from '../features/auth/context/AuthContext';
import { OnboardingProvider } from '../features/onboarding/context/OnboardingContext';
import { InboxScreen } from '../features/inbox/screens/InboxScreen';
import { VoiceCommandScreen } from '../features/ai/screens/VoiceCommandScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<ScheduleStackParamList>();

const labels = {
  today: '\uC624\uB298',
  week: '\uC8FC\uAC04',
  month: '\uC6D4\uAC04',
  productivity: '\uC0DD\uC0B0\uC131',
  settings: '\uC124\uC815',
  scheduleDetail: '\uC77C\uC815 \uC0C1\uC138',
  scheduleEdit: '\uC77C\uC815 \uD3B8\uC9D1',
  focusMode: '\uD3EC\uCEE4\uC2A4 \uBAA8\uB4DC',
  categoryTagManager: '\uCE74\uD14C\uACE0\uB9AC\uC640 \uD0DC\uADF8',
  routineManager: '\uB8E8\uD2F4',
  goalManager: '\uBAA9\uD45C',
  dailyReview: '\uD558\uB8E8 \uD68C\uACE0',
  inbox: 'Inbox',
  voiceCommand: '음성으로 일정 추가'
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="MonthlyCalendar"
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => <View />,
        tabBarIconStyle: {
          display: 'none',
          width: 0,
          height: 0,
          margin: 0
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 58,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: colors.surface
        },
        tabBarItemStyle: {
          justifyContent: 'center'
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '900',
          lineHeight: 16
        }
      }}
    >
      <Tab.Screen name="MonthlyCalendar" component={MonthlyCalendarScreen} options={{ title: labels.month }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: labels.today }} />
      <Tab.Screen name="WeeklySchedule" component={WeeklyScheduleScreen} options={{ title: labels.week }} />
      <Tab.Screen name="Productivity" component={ProductivityScreen} options={{ title: labels.productivity }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: labels.settings }} />
    </Tab.Navigator>
  );
}

export function RootTabs({
  navigateToGuideTab
}: {
  navigateToGuideTab: (route: keyof RootTabParamList) => void;
}) {
  const { user } = useAuthContext();

  if (!user) return null;

  return (
    <OnboardingProvider userId={user.id} navigateToTab={navigateToGuideTab}>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} options={{ title: labels.scheduleDetail }} />
        <Stack.Screen name="ScheduleEdit" component={ScheduleEditScreen} options={{ title: labels.scheduleEdit, presentation: 'modal' }} />
        <Stack.Screen name="FocusMode" component={FocusModeScreen} options={{ title: labels.focusMode }} />
        <Stack.Screen name="CategoryTagManager" component={CategoryTagManagerScreen} options={{ title: labels.categoryTagManager }} />
        <Stack.Screen name="RoutineManager" component={RoutineManagerScreen} options={{ title: labels.routineManager }} />
        <Stack.Screen name="GoalManager" component={GoalManagerScreen} options={{ title: labels.goalManager }} />
        <Stack.Screen name="DailyReview" component={DailyReviewScreen} options={{ title: labels.dailyReview }} />
        <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: labels.inbox }} />
        <Stack.Screen name="VoiceCommand" component={VoiceCommandScreen} options={{ title: labels.voiceCommand }} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
