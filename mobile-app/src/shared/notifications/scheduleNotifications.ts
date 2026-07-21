import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Schedule } from '../../features/schedules/dto/schedule.dto';

const notificationKey = (scheduleId: number) => `antiadhd.schedule-notification.${scheduleId}`;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}

export async function cancelScheduleReminder(scheduleId: number) {
  if (Platform.OS === 'web') return;
  const key = notificationKey(scheduleId);
  const notificationId = await AsyncStorage.getItem(key);
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
  await AsyncStorage.removeItem(key);
}

export async function syncScheduleReminder(schedule: Schedule) {
  if (Platform.OS === 'web') return;
  try {
    await cancelScheduleReminder(schedule.id);
    if (schedule.completed) return;

    const start = new Date(schedule.startAt);
    const reminderAt = new Date(start.getTime() - 10 * 60_000);
    const triggerAt = reminderAt.getTime() > Date.now() ? reminderAt : start;
    if (triggerAt.getTime() <= Date.now()) return;

    const currentPermission = await Notifications.getPermissionsAsync();
    const permission = currentPermission.granted
      ? currentPermission
      : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '곧 시작할 일정이 있어요',
        body: `${schedule.title} · ${start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`,
        data: { scheduleId: schedule.id }
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt }
    });
    await AsyncStorage.setItem(notificationKey(schedule.id), notificationId);
  } catch {
    // Notification permission or OS scheduling failure must not fail schedule persistence.
  }
}
