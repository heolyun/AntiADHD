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
    Alert.alert('Delete schedule', `Delete "${schedule.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
        <EmptyState text="Loading schedule..." />
      </Screen>
    );
  }

  if (!schedule) {
    return (
      <Screen>
        <EmptyState text={error || 'Schedule not found.'} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header eyebrow={formatDate(schedule.startAt)} title={schedule.title} />
      <View style={styles.card}>
        <View style={[styles.colorBar, { backgroundColor: schedule.color }]} />
        <Text style={styles.label}>Time</Text>
        <Text style={styles.value}>{formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}</Text>
        <Text style={styles.label}>Repeat</Text>
        <Text style={styles.value}>{repeatLabels[schedule.repeatType]}</Text>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{schedule.completed ? 'Completed' : 'Open'}</Text>
        {schedule.description ? (
          <>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.description}>{schedule.description}</Text>
          </>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button title={schedule.completed ? 'Mark open' : 'Mark done'} variant="secondary" onPress={toggleComplete} />
        <Button title="Edit" onPress={() => navigation.navigate('ScheduleEdit', { scheduleId: schedule.id })} />
        <Button title="Delete" variant="danger" onPress={confirmDelete} />
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

