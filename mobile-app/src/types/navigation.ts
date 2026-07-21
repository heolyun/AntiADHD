import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  MonthlyCalendar: undefined;
  Productivity: undefined;
  Settings: undefined;
};

export type ScheduleStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  ScheduleDetail: { scheduleId: number };
  ScheduleEdit: { scheduleId?: number; selectedDate?: string; draftTitle?: string; draftDescription?: string; durationMinutes?: number; inboxItemId?: number } | undefined;
  FocusMode: undefined;
  CategoryTagManager: undefined;
  RoutineManager: undefined;
  GoalManager: undefined;
  DailyReview: undefined;
  Inbox: undefined;
};

export type ScheduleDetailProps = NativeStackScreenProps<ScheduleStackParamList, 'ScheduleDetail'>;
export type ScheduleEditProps = NativeStackScreenProps<ScheduleStackParamList, 'ScheduleEdit'>;
export type FocusModeProps = NativeStackScreenProps<ScheduleStackParamList, 'FocusMode'>;
export type CategoryTagManagerProps = NativeStackScreenProps<ScheduleStackParamList, 'CategoryTagManager'>;
export type RoutineManagerProps = NativeStackScreenProps<ScheduleStackParamList, 'RoutineManager'>;
export type GoalManagerProps = NativeStackScreenProps<ScheduleStackParamList, 'GoalManager'>;
export type DailyReviewProps = NativeStackScreenProps<ScheduleStackParamList, 'DailyReview'>;
export type InboxProps = NativeStackScreenProps<ScheduleStackParamList, 'Inbox'>;
