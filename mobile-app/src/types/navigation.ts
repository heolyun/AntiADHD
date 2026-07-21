import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  WeeklySchedule: undefined;
  MonthlyCalendar: undefined;
  Productivity: undefined;
  Settings: undefined;
};

export type ScheduleStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  ScheduleDetail: { scheduleId: number };
  ScheduleEdit: { scheduleId?: number; selectedDate?: string } | undefined;
  FocusMode: undefined;
  CategoryTagManager: undefined;
  RoutineManager: undefined;
  GoalManager: undefined;
  DailyReview: undefined;
  Inbox: undefined;
  VoiceCommand: undefined;
};

export type ScheduleDetailProps = NativeStackScreenProps<ScheduleStackParamList, 'ScheduleDetail'>;
export type ScheduleEditProps = NativeStackScreenProps<ScheduleStackParamList, 'ScheduleEdit'>;
export type FocusModeProps = NativeStackScreenProps<ScheduleStackParamList, 'FocusMode'>;
export type CategoryTagManagerProps = NativeStackScreenProps<ScheduleStackParamList, 'CategoryTagManager'>;
export type RoutineManagerProps = NativeStackScreenProps<ScheduleStackParamList, 'RoutineManager'>;
export type GoalManagerProps = NativeStackScreenProps<ScheduleStackParamList, 'GoalManager'>;
export type DailyReviewProps = NativeStackScreenProps<ScheduleStackParamList, 'DailyReview'>;
export type InboxProps = NativeStackScreenProps<ScheduleStackParamList, 'Inbox'>;
export type VoiceCommandProps = NativeStackScreenProps<ScheduleStackParamList, 'VoiceCommand'>;
