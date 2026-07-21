import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Schedule } from '../schedules/dto/schedule.dto';

const STORAGE_KEY = '@atiadhd/today-widget';

export type TodayWidgetItem = {
  id: number;
  title: string;
  startAt: string;
  completed: boolean;
};

export type TodayWidgetData = {
  date: string;
  updatedAt: string;
  items: TodayWidgetItem[];
};

export async function saveTodayWidgetData(schedules: Schedule[]) {
  const data: TodayWidgetData = {
    date: localDateKey(new Date()),
    updatedAt: new Date().toISOString(),
    items: schedules
      .map(({ id, title, startAt, completed }) => ({ id, title, startAt, completed }))
      .sort((left, right) => left.startAt.localeCompare(right.startAt))
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  await refreshTodayWidget(data);
}

export async function loadTodayWidgetData(): Promise<TodayWidgetData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyWidgetData();
  try {
    const data = JSON.parse(raw) as TodayWidgetData;
    return data.date === localDateKey(new Date()) ? data : emptyWidgetData();
  } catch {
    return emptyWidgetData();
  }
}

async function refreshTodayWidget(data: TodayWidgetData) {
  if (Platform.OS !== 'android' || Constants.appOwnership === 'expo') return;
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const { TodayScheduleWidget } = require('./TodayScheduleWidget');
    const React = require('react');
    await requestWidgetUpdate({
      widgetName: 'TodaySchedule',
      renderWidget: () => React.createElement(TodayScheduleWidget, { data })
    });
  } catch {
    // Saving app data must still succeed when no widget has been added yet.
  }
}

function emptyWidgetData(): TodayWidgetData {
  return { date: localDateKey(new Date()), updatedAt: new Date().toISOString(), items: [] };
}

function localDateKey(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}
