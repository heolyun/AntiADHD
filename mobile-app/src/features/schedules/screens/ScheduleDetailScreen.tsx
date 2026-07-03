import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors, repeatLabels } from '../../../shared/constants/theme';
import { formatDate, formatTime } from '../../../shared/utils/date';
import type { ScheduleDetailProps } from '../../../types/navigation';
import { useScheduleDetail } from '../hooks/useScheduleDetail';

export function ScheduleDetailScreen({ navigation, route }: ScheduleDetailProps) {
  const { scheduleId } = route.params;
  const { schedule, isLoading, error, toggleComplete, remove } = useScheduleDetail(scheduleId);

  function confirmDelete() {
    if (!schedule) return;
    Alert.alert('일정 삭제', `"${schedule.title}" 일정을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await remove();
          navigation.goBack();
        }
      }
    ]);
  }

  if (isLoading) {
    return (
      <Screen>
        <EmptyState text="일정을 불러오는 중..." />
      </Screen>
    );
  }

  if (!schedule) {
    return (
      <Screen>
        <EmptyState text={error || '일정을 찾을 수 없습니다.'} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header eyebrow={formatDate(schedule.startAt)} title={schedule.title} />
      <View style={styles.card}>
        <View style={[styles.colorBar, { backgroundColor: schedule.color }]} />
        <Text style={styles.label}>시간</Text>
        <Text style={styles.value}>{formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}</Text>
        <Text style={styles.label}>반복</Text>
        <Text style={styles.value}>{repeatLabels[schedule.repeatType]}</Text>
        <Text style={styles.label}>상태</Text>
        <Text style={styles.value}>{schedule.completed ? '완료' : '진행 중'}</Text>
        {schedule.description ? (
          <>
            <Text style={styles.label}>메모</Text>
            <Text style={styles.description}>{schedule.description}</Text>
          </>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button title={schedule.completed ? '미완료로 변경' : '완료 체크'} variant="secondary" onPress={toggleComplete} />
        <Button title="수정" onPress={() => navigation.navigate('ScheduleEdit', { scheduleId: schedule.id })} />
        <Button title="삭제" variant="danger" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { position: 'relative', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 18, paddingLeft: 22, backgroundColor: colors.surface, gap: 6, overflow: 'hidden' },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', marginTop: 8 },
  value: { color: colors.text, fontSize: 17, fontWeight: '800' },
  description: { color: colors.text, lineHeight: 22 },
  actions: { gap: 10, marginTop: 18 }
});
