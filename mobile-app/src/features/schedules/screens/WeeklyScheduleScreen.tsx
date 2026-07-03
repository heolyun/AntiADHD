import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { addDays, formatTime, startOfWeek, toDateKey } from '../../../shared/utils/date';
import type { ScheduleStackParamList } from '../../../types/navigation';
import { useSchedules } from '../hooks/useSchedules';

type Navigation = NativeStackNavigationProp<ScheduleStackParamList>;

export function WeeklyScheduleScreen() {
  const navigation = useNavigation<Navigation>();
  const anchor = new Date();
  const weekStart = startOfWeek(anchor);
  const { schedules, isLoading, error, toggleComplete } = useSchedules('week', anchor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <Screen>
      <Header eyebrow="주간 타임블록" title="이번 주" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.days}>
        {days.map((day) => {
          const key = toDateKey(day);
          const items = schedules.filter((item) => item.startAt.slice(0, 10) === key);
          return (
            <View key={key} style={styles.dayCard}>
              <Text style={styles.dayTitle}>
                {day.toLocaleDateString('ko-KR', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              {isLoading ? <Text style={styles.muted}>불러오는 중...</Text> : null}
              {!isLoading && items.length === 0 ? <Text style={styles.muted}>비어 있음</Text> : null}
              {items.map((item) => (
                <Pressable key={item.id} style={styles.block} onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <View style={styles.blockText}>
                    <Text style={styles.time}>{formatTime(item.startAt)} - {formatTime(item.endAt)}</Text>
                    <Text style={styles.title}>{item.title}</Text>
                  </View>
                  <Pressable onPress={() => toggleComplete(item)} style={styles.done}>
                    <Text style={styles.doneText}>{item.completed ? '완료' : '체크'}</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { gap: 12, paddingBottom: 24 },
  dayCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, backgroundColor: colors.surface, gap: 10 },
  dayTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  muted: { color: colors.muted },
  block: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  dot: { width: 10, height: 36, borderRadius: 99 },
  blockText: { flex: 1 },
  time: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  title: { color: colors.text, fontWeight: '900' },
  done: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: colors.surfaceMuted },
  doneText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});

