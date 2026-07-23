import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { formatDate, groupByDate, toDateKey } from '../../../shared/utils/date';
import type { ScheduleStackParamList } from '../../../types/navigation';
import { ScheduleCard } from '../components/ScheduleCard';
import { useSchedules } from '../hooks/useSchedules';
import { useGuideTarget, useOnboarding } from '../../onboarding/context/OnboardingContext';
import { getKoreanHolidays } from '../api/scheduleApi';
import type { Holiday } from '../dto/holiday.dto';
import { ScheduleSyncBanner } from '../offline/ScheduleSyncBanner';

type Navigation = NativeStackNavigationProp<ScheduleStackParamList>;

const weekdays = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];

export function MonthlyCalendarScreen() {
  const navigation = useNavigation<Navigation>();
  const { activeTargetId } = useOnboarding();
  const monthlyAddTarget = useGuideTarget('monthly-add');
  const scrollRef = useRef<ScrollView>(null);
  const anchor = new Date();
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const { schedules, isLoading, error, toggleComplete } = useSchedules('month', anchor);
  const schedulesByDate = useMemo(() => groupByDate(schedules), [schedules]);
  const title = anchor.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const selectedSchedules = schedulesByDate[selectedDate] ?? [];
  const holidaysByDate = useMemo(
    () => Object.fromEntries(holidays.map((holiday) => [holiday.date, holiday])),
    [holidays]
  );

  useEffect(() => {
    let cancelled = false;
    getKoreanHolidays(anchor.getFullYear())
      .then((items) => { if (!cancelled) setHolidays(items); })
      .catch(() => { if (!cancelled) setHolidays([]); });
    return () => { cancelled = true; };
  }, [anchor.getFullYear()]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getDay();
    const totalDays = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay }, () => null);
    const days = Array.from({ length: totalDays }, (_, index) => new Date(anchor.getFullYear(), anchor.getMonth(), index + 1));
    return [...blanks, ...days];
  }, [anchor.getFullYear(), anchor.getMonth()]);

  useEffect(() => {
    if (activeTargetId !== 'monthly-add') return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [activeTargetId]);

  return (
    <Screen testID="monthly-calendar-screen">
      <Header eyebrow={'\uC6D4\uAC04 \uCE98\uB9B0\uB354'} title={title} />
      <ScheduleSyncBanner />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.calendar}>
          <View style={styles.weekHeader}>
            {weekdays.map((day, index) => (
              <Text
                key={day}
                style={[
                  styles.weekday,
                  index === 0 && styles.sunday,
                  index === 6 && styles.saturday
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <View key={`blank-${index}`} style={[styles.cell, styles.blankCell]} />;
              }

              const key = toDateKey(day);
              const items = schedulesByDate[key] ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const holiday = holidaysByDate[key];
              const dayOfWeek = day.getDay();

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.cell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                    items.length > 0 && styles.hasScheduleCell
                  ]}
                  onPress={() => setSelectedDate(key)}
                >
                  <View style={styles.dayHeader}>
                    <Text style={[
                      styles.dayNumber,
                      (dayOfWeek === 0 || holiday) && styles.sundayNumber,
                      dayOfWeek === 6 && !holiday && styles.saturdayNumber,
                      isToday && styles.todayNumber
                    ]}>{day.getDate()}</Text>
                    {items.length > 0 ? <Text style={styles.count}>{items.length}</Text> : null}
                  </View>

                  <View style={styles.scheduleArea}>
                    {holiday ? <Text numberOfLines={1} style={styles.holidayName}>{holiday.name}</Text> : null}
                    {isLoading ? <View style={styles.loadingLine} /> : null}
                    {!isLoading && items.slice(0, 2).map((item) => (
                      <View key={item.id} style={styles.scheduleChip}>
                        <View style={[styles.scheduleColor, { backgroundColor: item.color }]} />
                        <Text numberOfLines={1} style={styles.scheduleTitle}>{item.title}</Text>
                      </View>
                    ))}
                    {!isLoading && items.length > 2 ? (
                      <Text style={styles.more}>+{items.length - 2}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.selectedPanel}>
          <View style={styles.selectedHeader}>
            <View style={styles.selectedTitleBox}>
              <Text style={styles.selectedEyebrow}>{'\uC120\uD0DD\uD55C \uB0A0\uC9DC'}</Text>
              <Text style={styles.selectedTitle}>{formatDate(`${selectedDate}T00:00:00`)}</Text>
            </View>
            <Button
              ref={monthlyAddTarget.ref}
              nativeID={monthlyAddTarget.nativeID}
              onLayout={monthlyAddTarget.onLayout}
              title={'\uCD94\uAC00'}
              onPress={() => navigation.navigate('ScheduleEdit', { selectedDate })}
            />
          </View>

          {selectedSchedules.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{'\uC77C\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</Text>
              <Text style={styles.emptyText}>{'\uC774 \uB0A0\uC758 \uC2DC\uAC04\uBE14\uB85D\uC744 \uCD94\uAC00\uD574\uBCF4\uC138\uC694.'}</Text>
            </View>
          ) : (
            <View style={styles.selectedList}>
              {selectedSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: schedule.id })}
                  onToggle={() => toggleComplete(schedule)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 24 },
  calendar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  weekday: {
    width: `${100 / 7}%`,
    paddingVertical: 11,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  sunday: { color: colors.danger },
  saturday: { color: colors.primary },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 92,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#edf1f7',
    padding: 6,
    backgroundColor: colors.surface
  },
  blankCell: { backgroundColor: '#f8fafc' },
  todayCell: { backgroundColor: '#eff6ff' },
  selectedCell: {
    borderColor: colors.primary,
    borderWidth: 2,
    padding: 5
  },
  hasScheduleCell: { backgroundColor: '#ffffff' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 },
  dayNumber: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    color: colors.text,
    fontSize: 12,
    fontWeight: '900'
  },
  todayNumber: { color: '#fff', backgroundColor: colors.primary },
  sundayNumber: { color: colors.danger },
  saturdayNumber: { color: colors.primary },
  count: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 17,
    color: colors.primary,
    backgroundColor: '#dbeafe',
    fontSize: 10,
    fontWeight: '900'
  },
  scheduleArea: { marginTop: 6, gap: 4 },
  holidayName: { color: colors.danger, fontSize: 9, fontWeight: '900' },
  scheduleChip: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 5,
    paddingHorizontal: 4,
    backgroundColor: '#f8fafc'
  },
  scheduleColor: { width: 3, height: 12, borderRadius: 2 },
  scheduleTitle: { flex: 1, color: colors.text, fontSize: 10, fontWeight: '800' },
  more: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  loadingLine: { height: 18, borderRadius: 5, backgroundColor: colors.surfaceMuted },
  selectedPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
    gap: 14
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedTitleBox: { flex: 1 },
  selectedEyebrow: { color: colors.muted, fontSize: 12, fontWeight: '900', marginBottom: 4 },
  selectedTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  selectedList: { gap: 10 },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#edf1f7',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8fafc'
  },
  emptyTitle: { color: colors.text, fontWeight: '900', marginBottom: 4 },
  emptyText: { color: colors.muted, lineHeight: 20 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
