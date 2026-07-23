import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { ScheduleList } from '../components/ScheduleList';
import { useSchedules } from '../hooks/useSchedules';
import type { ScheduleStackParamList } from '../../../types/navigation';
import { GuideTarget } from '../../onboarding/context/OnboardingContext';
import { getOverdueSchedules, updateSchedule } from '../api/scheduleApi';
import type { Schedule } from '../dto/schedule.dto';
import { toDateKey, toLocalDateTimeValue } from '../../../shared/utils/date';
import { getErrorMessage } from '../../../shared/utils/error';
import { materializeRoutines } from '../../routines/api/routineApi';
import { VoiceCommandModal } from '../../ai/screens/VoiceCommandScreen';
import { ScheduleSyncBanner } from '../offline/ScheduleSyncBanner';
import { isOfflineRetryable } from '../offline/scheduleOfflineStore';

type Navigation = NativeStackNavigationProp<ScheduleStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const today = new Date();
  const { schedules, isLoading, error, toggleComplete, refresh: refreshSchedules } = useSchedules('today', today);
  const [overdue, setOverdue] = useState<Schedule[]>([]);
  const [overdueError, setOverdueError] = useState<string | null>(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const openScheduleEditor = () => {
    setQuickAddVisible(false);
    navigation.navigate('ScheduleEdit');
  };

  const openInbox = () => {
    setQuickAddVisible(false);
    navigation.navigate('Inbox');
  };

  const openVoiceCommand = () => {
    setQuickAddVisible(false);
    setVoiceModalVisible(true);
  };

  const refreshOverdue = useCallback(async () => {
    try {
      setOverdue(await getOverdueSchedules(toLocalDateTimeValue(new Date())));
      setOverdueError(null);
    } catch (err) {
      setOverdueError(getErrorMessage(err));
    }
  }, []);

  useFocusEffect(useCallback(() => { refreshOverdue(); }, [refreshOverdue]));

  useFocusEffect(useCallback(() => {
    materializeRoutines(toDateKey(new Date()))
      .then(() => refreshSchedules())
      .catch((err) => {
        if (!isOfflineRetryable(err)) setOverdueError(getErrorMessage(err));
      });
  }, [refreshSchedules]));

  const moveToTomorrow = useCallback(async (schedule: Schedule) => {
    const originalStart = new Date(schedule.startAt);
    const duration = new Date(schedule.endAt).getTime() - originalStart.getTime();
    const nextStart = new Date();
    nextStart.setDate(nextStart.getDate() + 1);
    nextStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    try {
      await updateSchedule(schedule.id, {
        title: schedule.title,
        description: schedule.description ?? undefined,
        startAt: toLocalDateTimeValue(nextStart),
        endAt: toLocalDateTimeValue(new Date(nextStart.getTime() + duration)),
        color: schedule.color,
        repeatType: schedule.repeatType,
        categoryId: schedule.category?.id ?? null,
        tagIds: schedule.tags.map((tag) => tag.id)
      });
      await refreshOverdue();
    } catch (err) {
      setOverdueError(getErrorMessage(err));
    }
  }, [refreshOverdue]);

  return (
    <Screen testID="today-screen">
      <Header
        eyebrow="오늘 일정"
        title={today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
      />
      <ScheduleSyncBanner />
      <View style={styles.summary}>
        <Text style={styles.summaryText}>전체 {schedules.length}</Text>
        <Text style={styles.summaryText}>완료 {schedules.filter((item) => item.completed).length}</Text>
      </View>
      {overdue.length > 0 ? (
        <View style={styles.overdueBox}>
          <Text style={styles.overdueTitle}>놓친 일정 {overdue.length}개</Text>
          <Text style={styles.overdueHelp}>완료하지 못한 일정을 방치하지 말고 다시 배치하세요.</Text>
          {overdue.slice(0, 5).map((schedule) => (
            <View key={schedule.id} style={styles.overdueItem}>
              <View style={styles.overdueTextBox}>
                <Text style={styles.overdueItemTitle}>{schedule.title}</Text>
                <Text style={styles.overdueTime}>{new Date(schedule.startAt).toLocaleString('ko-KR')}</Text>
              </View>
              <Button title="내일로" variant="secondary" onPress={() => moveToTomorrow(schedule)} />
            </View>
          ))}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {overdueError ? <Text style={styles.error}>{overdueError}</Text> : null}
      <ScheduleList
        schedules={schedules}
        isLoading={isLoading}
        onSelect={(schedule) => navigation.navigate('ScheduleDetail', { scheduleId: schedule.id })}
        onToggle={toggleComplete}
      />
      <GuideTarget id="today-add" style={styles.fabContainer}>
        <Pressable
          testID="today-add-menu"
          accessibilityRole="button"
          accessibilityLabel="추가 메뉴 열기"
          style={styles.fab}
          onPress={() => setQuickAddVisible(true)}
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </GuideTarget>
      <Modal
        visible={quickAddVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickAddVisible(false)}
      >
        <View style={styles.quickAddBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setQuickAddVisible(false)} />
          <View style={styles.quickAddMenu}>
            <Text style={styles.quickAddTitle}>무엇을 추가할까요?</Text>
            <QuickAddOption
              icon="📅"
              title="일정 추가"
              description="날짜와 시간을 정해서 추가"
              onPress={openScheduleEditor}
            />
            <QuickAddOption
              icon="📥"
              title="나중에 정리"
              description="시간을 아직 정하지 않은 일"
              onPress={openInbox}
            />
            <QuickAddOption
              icon="🎤"
              title="음성으로 추가"
              description="말하면 AI가 일정 초안을 작성"
              onPress={openVoiceCommand}
            />
            <Pressable style={styles.quickAddCancel} onPress={() => setQuickAddVisible(false)}>
              <Text style={styles.quickAddCancelText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <VoiceCommandModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSaved={() => { setVoiceModalVisible(false); refreshSchedules(); }}
      />
    </Screen>
  );
}

function QuickAddOption({
  icon,
  title,
  description,
  onPress
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.quickAddOption} onPress={onPress}>
      <View style={styles.quickAddIcon}><Text style={styles.quickAddIconText}>{icon}</Text></View>
      <View style={styles.quickAddTextBox}>
        <Text style={styles.quickAddOptionTitle}>{title}</Text>
        <Text style={styles.quickAddDescription}>{description}</Text>
      </View>
      <Text style={styles.quickAddChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryText: {
    color: colors.muted,
    backgroundColor: colors.surface,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: 'hidden',
    fontWeight: '800'
  },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' },
  fabContainer: {
    position: 'absolute',
    right: 22,
    bottom: 24,
  },
  overdueBox: { borderWidth: 1, borderColor: colors.warning, borderRadius: 12, padding: 12, backgroundColor: '#fffbeb', gap: 9, marginBottom: 14 },
  overdueTitle: { color: '#92400e', fontSize: 16, fontWeight: '900' },
  overdueHelp: { color: '#92400e', fontSize: 12 },
  overdueItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#fde68a', paddingTop: 9 },
  overdueTextBox: { flex: 1 },
  overdueItemTitle: { color: colors.text, fontWeight: '800' },
  overdueTime: { color: colors.muted, fontSize: 11, marginTop: 3 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '700', marginTop: -2 },
  quickAddBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
    padding: 16
  },
  quickAddMenu: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    backgroundColor: colors.surface
  },
  quickAddTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginBottom: 2 },
  quickAddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
    backgroundColor: colors.surface
  },
  quickAddIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted
  },
  quickAddIconText: { fontSize: 21 },
  quickAddTextBox: { flex: 1 },
  quickAddOptionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  quickAddDescription: { color: colors.muted, fontSize: 12, marginTop: 3 },
  quickAddChevron: { color: colors.muted, fontSize: 28, lineHeight: 30 },
  quickAddCancel: { alignItems: 'center', paddingVertical: 10 },
  quickAddCancelText: { color: colors.muted, fontWeight: '800' }
});

