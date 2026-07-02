import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { toDateKey } from '../../../shared/utils/date';
import type { ScheduleStackParamList } from '../../../types/navigation';
import { useSchedules } from '../hooks/useSchedules';

type Navigation = NativeStackNavigationProp<ScheduleStackParamList>;

export function MonthlyCalendarScreen() {
  const navigation = useNavigation<Navigation>();
  const anchor = new Date();
  const { schedules, isLoading, error } = useSchedules('month', anchor);
  const totalDays = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, index) => new Date(anchor.getFullYear(), anchor.getMonth(), index + 1));

  return (
    <Screen>
      <Header eyebrow="Calendar" title={anchor.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.grid}>
        {days.map((day) => {
          const key = toDateKey(day);
          const items = schedules.filter((item) => item.startAt.slice(0, 10) === key);
          return (
            <Pressable
              key={key}
              style={styles.day}
              onPress={() => items[0] && navigation.navigate('ScheduleDetail', { scheduleId: items[0].id })}
            >
              <Text style={styles.dayNumber}>{day.getDate()}</Text>
              {isLoading ? <Text style={styles.count}>...</Text> : <Text style={styles.count}>{items.length} items</Text>}
              <View style={styles.dots}>
                {items.slice(0, 4).map((item) => <View key={item.id} style={[styles.dot, { backgroundColor: item.color }]} />)}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 24 },
  day: { width: '31.7%', minHeight: 92, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, backgroundColor: colors.surface },
  dayNumber: { color: colors.text, fontSize: 18, fontWeight: '900' },
  count: { color: colors.muted, marginTop: 4, fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});

