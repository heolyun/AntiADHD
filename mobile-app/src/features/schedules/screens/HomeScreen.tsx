import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { ScheduleList } from '../components/ScheduleList';
import { useSchedules } from '../hooks/useSchedules';
import type { ScheduleStackParamList } from '../../../types/navigation';
import { GuideTarget } from '../../onboarding/context/OnboardingContext';

type Navigation = NativeStackNavigationProp<ScheduleStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const today = new Date();
  const { schedules, isLoading, error, toggleComplete } = useSchedules('today', today);

  return (
    <Screen>
      <Header
        eyebrow="오늘 일정"
        title={today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
        right={(
          <View style={styles.headerActions}>
            <Button title="Inbox" variant="secondary" onPress={() => navigation.navigate('Inbox')} />
            <Button title="일정 추가" onPress={() => navigation.navigate('ScheduleEdit')} />
          </View>
        )}
      />
      <View style={styles.summary}>
        <Text style={styles.summaryText}>전체 {schedules.length}</Text>
        <Text style={styles.summaryText}>완료 {schedules.filter((item) => item.completed).length}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScheduleList
        schedules={schedules}
        isLoading={isLoading}
        onSelect={(schedule) => navigation.navigate('ScheduleDetail', { scheduleId: schedule.id })}
        onToggle={toggleComplete}
      />
      <GuideTarget id="today-add" style={styles.fabContainer}>
        <Pressable style={styles.fab} onPress={() => navigation.navigate('ScheduleEdit')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </GuideTarget>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: 8 },
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
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '700', marginTop: -2 }
});

