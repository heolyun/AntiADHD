import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAiSuggestions } from '../../ai/api/aiApi';
import { getCategories } from '../../categories/api/categoryApi';
import { getFocusSessions } from '../../focus/api/focusApi';
import { getGoals } from '../../goals/api/goalApi';
import { getDailyReviews } from '../../reviews/api/dailyReviewApi';
import { getRoutines } from '../../routines/api/routineApi';
import { getTags } from '../../tags/api/tagApi';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import type { ScheduleStackParamList } from '../../../types/navigation';

type ProductivitySummary = {
  categories: number;
  tags: number;
  routines: number;
  activeRoutines: number;
  goals: number;
  completedGoals: number;
  focusSessions: number;
  completedFocusSessions: number;
  dailyReviews: number;
  suggestions: string[];
};

const initialSummary: ProductivitySummary = {
  categories: 0,
  tags: 0,
  routines: 0,
  activeRoutines: 0,
  goals: 0,
  completedGoals: 0,
  focusSessions: 0,
  completedFocusSessions: 0,
  dailyReviews: 0,
  suggestions: []
};

export function ProductivityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ScheduleStackParamList>>();
  const [summary, setSummary] = useState<ProductivitySummary>(initialSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [categories, tags, routines, goals, focusSessions, dailyReviews, ai] = await Promise.all([
        getCategories(),
        getTags(),
        getRoutines(),
        getGoals(),
        getFocusSessions(),
        getDailyReviews(),
        getAiSuggestions()
      ]);

      setSummary({
        categories: categories.length,
        tags: tags.length,
        routines: routines.length,
        activeRoutines: routines.filter((routine) => routine.active).length,
        goals: goals.length,
        completedGoals: goals.filter((goal) => goal.status === 'DONE').length,
        focusSessions: focusSessions.length,
        completedFocusSessions: focusSessions.filter((session) => session.completed).length,
        dailyReviews: dailyReviews.length,
        suggestions: ai.suggestions
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  return (
    <Screen>
      <Header eyebrow="AI 생산성 관리" title="생산성 대시보드" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>바로 실행</Text>
          <View style={styles.actionGrid}>
            <Button title="포커스 모드" onPress={() => navigation.navigate('FocusMode')} />
            <Button title="카테고리/태그" variant="secondary" onPress={() => navigation.navigate('CategoryTagManager')} />
            <Button title="루틴 관리" variant="secondary" onPress={() => navigation.navigate('RoutineManager')} />
            <Button title="목표 관리" variant="secondary" onPress={() => navigation.navigate('GoalManager')} />
            <Button title="하루 회고" variant="secondary" onPress={() => navigation.navigate('DailyReview')} />
          </View>
        </View>

        <View style={styles.grid}>
          <SummaryCard label="카테고리" value={summary.categories} />
          <SummaryCard label="태그" value={summary.tags} />
          <SummaryCard label="활성 루틴" value={`${summary.activeRoutines}/${summary.routines}`} />
          <SummaryCard label="완료 목표" value={`${summary.completedGoals}/${summary.goals}`} />
          <SummaryCard label="완료 Focus" value={`${summary.completedFocusSessions}/${summary.focusSessions}`} />
          <SummaryCard label="Daily Review" value={summary.dailyReviews} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI 확장 준비</Text>
          <Text style={styles.description}>
            현재는 외부 AI API를 호출하지 않고, 추후 모델 연동을 위한 API 경계만 제공합니다.
          </Text>
          {summary.suggestions.map((suggestion) => (
            <Text key={suggestion} style={styles.suggestion}>- {suggestion}</Text>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginBottom: 12 },
  content: { gap: 14, paddingBottom: 28 },
  actionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 12
  },
  actionGrid: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48%',
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface
  },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  summaryValue: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 6 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 8
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.muted, lineHeight: 20 },
  suggestion: { color: colors.text, lineHeight: 22 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
