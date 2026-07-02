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
  Settings: undefined;
};

export type ScheduleStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  ScheduleDetail: { scheduleId: number };
  ScheduleEdit: { scheduleId?: number } | undefined;
};

export type ScheduleDetailProps = NativeStackScreenProps<ScheduleStackParamList, 'ScheduleDetail'>;
export type ScheduleEditProps = NativeStackScreenProps<ScheduleStackParamList, 'ScheduleEdit'>;

