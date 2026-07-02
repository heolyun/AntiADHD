import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ScheduleCard } from './ScheduleCard';
import { colors } from '../../../shared/constants/theme';
import type { Schedule } from '../dto/schedule.dto';
import { formatDate, groupByDate } from '../../../shared/utils/date';

type ScheduleListProps = {
  schedules: Schedule[];
  isLoading: boolean;
  onSelect: (schedule: Schedule) => void;
  onToggle: (schedule: Schedule) => void;
};

export function ScheduleList({ schedules, isLoading, onSelect, onToggle }: ScheduleListProps) {
  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  }

  if (schedules.length === 0) {
    return <EmptyState text="No schedules yet." />;
  }

  const sections = Object.entries(groupByDate(schedules));

  return (
    <FlatList
      data={sections}
      keyExtractor={([date]) => date}
      contentContainerStyle={styles.list}
      renderItem={({ item: [date, items] }) => (
        <View style={styles.section}>
          <Text style={styles.date}>{formatDate(date)}</Text>
          <View style={styles.cards}>
            {items.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onPress={() => onSelect(schedule)}
                onToggle={() => onToggle(schedule)}
              />
            ))}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 40 },
  list: { gap: 22, paddingBottom: 28 },
  section: { gap: 10 },
  date: { color: colors.text, fontSize: 15, fontWeight: '900' },
  cards: { gap: 10 }
});

