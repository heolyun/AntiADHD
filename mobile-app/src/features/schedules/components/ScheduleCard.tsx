import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, repeatLabels } from '../../../shared/constants/theme';
import type { Schedule } from '../dto/schedule.dto';
import { formatTime } from '../../../shared/utils/date';

type ScheduleCardProps = {
  schedule: Schedule;
  onPress: () => void;
  onToggle: () => void;
};

export function ScheduleCard({ schedule, onPress, onToggle }: ScheduleCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, schedule.completed && styles.completed]}>
      <View style={[styles.bar, { backgroundColor: schedule.color }]} />
      <Pressable onPress={onToggle} style={[styles.check, { borderColor: schedule.color }]}>
        {schedule.completed ? <Text style={styles.checkText}>✓</Text> : null}
      </Pressable>
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.time}>{formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}</Text>
          <Text style={styles.repeat}>{repeatLabels[schedule.repeatType]}</Text>
        </View>
        <Text style={styles.title}>{schedule.title}</Text>
        {schedule.description ? <Text style={styles.description}>{schedule.description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    paddingLeft: 18,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  completed: { opacity: 0.58 },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkText: { color: colors.text, fontWeight: '900' },
  content: { flex: 1, gap: 5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  time: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  repeat: {
    color: '#3730a3',
    backgroundColor: '#eef2ff',
    borderRadius: 99,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800'
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '900' },
  description: { color: colors.muted, lineHeight: 20 }
});

