import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createTaskBreakdown, getAiJob } from '../../ai/api/aiApi';
import type { AiJobResponse, TaskBreakdownStep } from '../../ai/dto/ai.dto';
import { getFocusSessions } from '../../focus/api/focusApi';
import { getGoals } from '../../goals/api/goalApi';
import { getDailyReviews } from '../../reviews/api/dailyReviewApi';
import { GuideTarget, useOnboarding } from '../../onboarding/context/OnboardingContext';
import { createSchedules, getOverdueSchedules, getSchedulesBetween } from '../../schedules/api/scheduleApi';
import type { ScheduleRequest } from '../../schedules/dto/schedule.dto';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import { toDateKey, toLocalDateTimeValue } from '../../../shared/utils/date';
import type { ScheduleStackParamList } from '../../../types/navigation';

type ProductivitySummary = {
  scheduled: number;
  completedSchedules: number;
  completionRate: number;
  overdue: number;
  activeGoals: number;
  focusSessions: number;
  focusMinutes: number;
  dailyReviews: number;
};

const initialSummary: ProductivitySummary = {
  scheduled: 0,
  completedSchedules: 0,
  completionRate: 0,
  overdue: 0,
  activeGoals: 0,
  focusSessions: 0,
  focusMinutes: 0,
  dailyReviews: 0
};

function defaultScheduleStart() {
  const date = new Date();
  date.setMinutes(Math.ceil((date.getMinutes() + 1) / 30) * 30, 0, 0);
  return toLocalDateTimeValue(date).slice(0, 16).replace('T', ' ');
}

export function ProductivityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ScheduleStackParamList>>();
  const { activeTargetId } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [summary, setSummary] = useState<ProductivitySummary>(initialSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [availableMinutes, setAvailableMinutes] = useState('60');
  const [aiJob, setAiJob] = useState<AiJobResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedStepOrders, setSelectedStepOrders] = useState<number[]>([]);
  const [draftSteps, setDraftSteps] = useState<TaskBreakdownStep[]>([]);
  const [scheduleStart, setScheduleStart] = useState(defaultScheduleStart);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [scheduleConflicts, setScheduleConflicts] = useState<string[]>([]);
  const [pendingSchedules, setPendingSchedules] = useState<ScheduleRequest[] | null>(null);
  const [suggestedStart, setSuggestedStart] = useState<string | null>(null);
  const [showAiBreakdown, setShowAiBreakdown] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();
      const weekStart = new Date(now);
      const day = weekStart.getDay() || 7;
      weekStart.setDate(weekStart.getDate() - day + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const [schedules, overdue, goals, focusSessions, dailyReviews] = await Promise.all([
        getSchedulesBetween(toLocalDateTimeValue(weekStart), toLocalDateTimeValue(weekEnd)),
        getOverdueSchedules(toLocalDateTimeValue(now)),
        getGoals(),
        getFocusSessions(),
        getDailyReviews()
      ]);

      const completedSchedules = schedules.filter((schedule) => schedule.completed).length;
      const weeklyFocus = focusSessions.filter((session) => {
        const startedAt = new Date(session.startedAt ?? session.createdAt);
        return session.completed && startedAt >= weekStart && startedAt < weekEnd;
      });
      const focusMinutes = weeklyFocus.reduce((total, session) => {
        if (session.startedAt && session.endedAt) {
          return total + Math.max(0, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60_000));
        }
        return total + (session.plannedMinutes ?? 0);
      }, 0);
      const weekStartKey = toDateKey(weekStart);
      const weekEndKey = toDateKey(weekEnd);

      setSummary({
        scheduled: schedules.length,
        completedSchedules,
        completionRate: schedules.length === 0 ? 0 : Math.round((completedSchedules / schedules.length) * 100),
        overdue: overdue.length,
        activeGoals: goals.filter((goal) => goal.status !== 'DONE').length,
        focusSessions: weeklyFocus.length,
        focusMinutes,
        dailyReviews: dailyReviews.filter((review) => review.reviewDate >= weekStartKey && review.reviewDate < weekEndKey).length
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

  useEffect(() => {
    if (activeTargetId !== 'productivity-actions' && activeTargetId !== 'productivity-ai') return;
    const timer = setTimeout(() => {
      if (activeTargetId === 'productivity-ai') {
        setShowAiBreakdown(true);
        scrollRef.current?.scrollToEnd({ animated: true });
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [activeTargetId]);

  useEffect(() => {
    if (!aiJob?.result) return;
    setSelectedStepOrders(aiJob.result.steps.map((step) => step.order));
    setDraftSteps(aiJob.result.steps);
    setSaveMessage(null);
  }, [aiJob?.result]);

  const generateBreakdown = useCallback(async () => {
    const trimmedGoal = goal.trim();
    const minutes = Number(availableMinutes);
    if (!trimmedGoal) {
      setAiError('분해할 목표를 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
      setAiError('사용 가능 시간은 5~480분 사이로 입력해 주세요.');
      return;
    }
    const trimmedDeadline = deadline.trim();
    if (trimmedDeadline) {
      const parsedDeadline = new Date(`${trimmedDeadline}T00:00:00`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDeadline)
        || Number.isNaN(parsedDeadline.getTime())
        || toDateKey(parsedDeadline) !== trimmedDeadline) {
        setAiError('마감일은 YYYY-MM-DD 형식의 실제 날짜로 입력해 주세요.');
        return;
      }
    }

    setIsGenerating(true);
    setAiError(null);
    setAiJob(null);
    try {
      const accepted = await createTaskBreakdown({
        goal: trimmedGoal,
        deadline: trimmedDeadline || undefined,
        availableMinutes: minutes
      });
      for (let poll = 0; poll < 45; poll += 1) {
        const job = await getAiJob(accepted.jobId);
        setAiJob(job);
        if (job.status === 'COMPLETED') return;
        if (job.status === 'FAILED') {
          setAiError(job.failureMessage ?? 'AI 작업 분해에 실패했습니다.');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      setAiError('처리가 길어지고 있습니다. 잠시 후 다시 시도해 주세요.');
    } catch (err) {
      setAiError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }, [availableMinutes, deadline, goal]);

  const toggleStep = useCallback((order: number) => {
    setSelectedStepOrders((current) => current.includes(order)
      ? current.filter((value) => value !== order)
      : [...current, order]);
    setScheduleConflicts([]);
    setPendingSchedules(null);
    setSuggestedStart(null);
  }, []);

  const updateDraftStep = useCallback((order: number, changes: Partial<TaskBreakdownStep>) => {
    setDraftSteps((current) => current.map((step) => step.order === order ? { ...step, ...changes } : step));
    setSaveMessage(null);
    setScheduleConflicts([]);
    setPendingSchedules(null);
    setSuggestedStart(null);
  }, []);

  const persistSchedules = useCallback(async (schedules: ScheduleRequest[]) => {
    setIsSavingSchedules(true);
    setAiError(null);
    setSaveMessage(null);
    try {
      await createSchedules(schedules);
      setSaveMessage(`${schedules.length}개 단계를 일정으로 저장했습니다.`);
      setScheduleConflicts([]);
      setPendingSchedules(null);
      setSuggestedStart(null);
    } catch (err) {
      setAiError(getErrorMessage(err));
    } finally {
      setIsSavingSchedules(false);
    }
  }, []);

  const saveSelectedSteps = useCallback(async () => {
    if (!aiJob?.result) return;
    const normalizedStart = scheduleStart.trim().replace(' ', 'T');
    const start = new Date(normalizedStart.length === 16 ? `${normalizedStart}:00` : normalizedStart);
    if (Number.isNaN(start.getTime())) {
      setAiError('시작 날짜와 시간을 YYYY-MM-DD HH:mm 형식으로 입력해 주세요.');
      return;
    }
    const selectedSteps = draftSteps.filter((step) => selectedStepOrders.includes(step.order));
    if (selectedSteps.length === 0) {
      setAiError('일정으로 저장할 단계를 하나 이상 선택해 주세요.');
      return;
    }
    if (selectedSteps.some((step) => !step.title.trim())) {
      setAiError('선택한 모든 단계에 제목을 입력해 주세요.');
      return;
    }
    if (selectedSteps.some((step) => !Number.isInteger(step.estimatedMinutes) || step.estimatedMinutes < 1 || step.estimatedMinutes > 480)) {
      setAiError('각 단계의 예상 시간은 1~480분 사이로 입력해 주세요.');
      return;
    }

    setIsSavingSchedules(true);
    setAiError(null);
    setSaveMessage(null);
    setScheduleConflicts([]);
    setPendingSchedules(null);
    setSuggestedStart(null);
    try {
      let cursor = new Date(start);
      const schedules = selectedSteps.map((step) => {
        const stepStart = new Date(cursor);
        cursor = new Date(cursor.getTime() + step.estimatedMinutes * 60_000);
        const color = step.energyLevel === 'HIGH' ? '#ef4444' : step.energyLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e';
        return {
          title: step.title.trim(),
          description: step.description.trim(),
          startAt: toLocalDateTimeValue(stepStart),
          endAt: toLocalDateTimeValue(cursor),
          color,
          repeatType: 'NONE' as const
        };
      });
      const proposedStart = new Date(schedules[0].startAt);
      const proposedEnd = new Date(schedules[schedules.length - 1].endAt);
      const searchEnd = new Date(proposedStart.getTime() + 7 * 24 * 60 * 60_000);
      const existing = await getSchedulesBetween(schedules[0].startAt, toLocalDateTimeValue(searchEnd));
      const conflicts = existing.filter((schedule) => (
        new Date(schedule.startAt) < proposedEnd && new Date(schedule.endAt) > proposedStart
      ));
      if (conflicts.length > 0) {
        const duration = proposedEnd.getTime() - proposedStart.getTime();
        let candidate = new Date(proposedStart);
        for (const schedule of [...existing].sort((left, right) => left.startAt.localeCompare(right.startAt))) {
          const existingStart = new Date(schedule.startAt);
          const existingEnd = new Date(schedule.endAt);
          if (existingEnd <= candidate) continue;
          if (existingStart.getTime() >= candidate.getTime() + duration) break;
          candidate = existingEnd;
        }
        setScheduleConflicts(conflicts.map((schedule) => `${schedule.title} · ${schedule.startAt.slice(5, 16).replace('T', ' ')}~${schedule.endAt.slice(11, 16)}`));
        setPendingSchedules(schedules);
        setSuggestedStart(toLocalDateTimeValue(candidate).slice(0, 16).replace('T', ' '));
        return;
      }
      await persistSchedules(schedules);
    } catch (err) {
      setAiError(getErrorMessage(err));
    } finally {
      setIsSavingSchedules(false);
    }
  }, [aiJob?.result, draftSteps, persistSchedules, scheduleStart, selectedStepOrders]);

  return (
    <Screen>
      <Header eyebrow="이번 주 실행 상태" title="리포트" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <GuideTarget id="productivity-actions" style={styles.actionCard}>
          <Text style={styles.cardTitle}>바로 실행</Text>
          <View style={styles.actionGrid}>
            <Button title="포커스 모드" onPress={() => navigation.navigate('FocusMode')} />
            <Button title="카테고리/태그" variant="secondary" onPress={() => navigation.navigate('CategoryTagManager')} />
            <Button title="루틴 관리" variant="secondary" onPress={() => navigation.navigate('RoutineManager')} />
            <Button title="목표 관리" variant="secondary" onPress={() => navigation.navigate('GoalManager')} />
            <Button title="하루 회고" variant="secondary" onPress={() => navigation.navigate('DailyReview')} />
          </View>
        </GuideTarget>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>{reportHeadline(summary)}</Text>
          <Text style={styles.insightText}>{reportAdvice(summary)}</Text>
        </View>

        <View style={styles.grid}>
          <SummaryCard label="이번 주 일정 완료" value={`${summary.completedSchedules}/${summary.scheduled}`} detail={`${summary.completionRate}% 완료`} />
          <SummaryCard label="집중한 시간" value={`${summary.focusMinutes}분`} detail={`${summary.focusSessions}회 집중`} />
          <SummaryCard label="밀린 일정" value={summary.overdue} detail={summary.overdue > 0 ? '오늘 다시 배치해 보세요' : '밀린 일정 없음'} tone={summary.overdue > 0 ? 'warning' : 'normal'} />
          <SummaryCard label="이번 주 회고" value={`${summary.dailyReviews}회`} detail="기록한 날 기준" />
          <SummaryCard label="진행 중인 목표" value={summary.activeGoals} detail="완료 전 목표" />
        </View>

        <GuideTarget id="productivity-ai" style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.cardTitle}>AI 작업 분해</Text>
              <Text style={styles.description}>필요할 때만 열어 목표를 실행 단계로 바꿔 보세요.</Text>
            </View>
            <Button title={showAiBreakdown ? '접기' : '열기'} variant="secondary" onPress={() => setShowAiBreakdown((current) => !current)} />
          </View>
          {showAiBreakdown ? <>
          <Text style={styles.description}>막막한 목표를 지금 시작할 수 있는 작은 단계로 나눕니다.</Text>
          <Text style={styles.inputLabel}>분해할 목표</Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            placeholder="예: Kubernetes 포트폴리오 발표 준비하기"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={[styles.input, styles.goalInput]}
          />
          <Text style={styles.inputLabel}>마감일(선택)</Text>
          <Text style={styles.inputHelp}>마감이 있다면 AI가 남은 시간을 고려해 단계를 구성합니다.</Text>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            maxLength={10}
            style={styles.input}
          />
          <Text style={styles.inputLabel}>사용 가능한 총 시간</Text>
          <Text style={styles.inputHelp}>AI가 이 시간 안에 끝낼 수 있도록 전체 작업을 나눠요. 단위는 분입니다.</Text>
          <TextInput
            value={availableMinutes}
            onChangeText={setAvailableMinutes}
            placeholder="예: 60분"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={3}
            style={styles.input}
          />
          <Button
            title="AI로 단계 만들기"
            onPress={generateBreakdown}
            loading={isGenerating}
            disabled={!goal.trim()}
          />
          {aiJob && aiJob.status !== 'COMPLETED' ? (
            <Text style={styles.status}>상태: {aiJob.status} · 시도 {aiJob.attemptCount}회</Text>
          ) : null}
          {aiError ? <Text style={styles.error}>{aiError}</Text> : null}
          {aiJob?.result ? (
            <View style={styles.result}>
              <Text style={styles.resultSummary}>{aiJob.result.summary}</Text>
              <Text style={styles.status}>
                선택한 단계 총 {draftSteps
                  .filter((step) => selectedStepOrders.includes(step.order))
                  .reduce((total, step) => total + step.estimatedMinutes, 0)}분
              </Text>
              {draftSteps.map((step) => (
                <View key={step.order} style={[styles.step, selectedStepOrders.includes(step.order) && styles.selectedStep]}>
                  <Pressable onPress={() => toggleStep(step.order)} style={styles.selectionButton}>
                    <Text style={styles.selection}>{selectedStepOrders.includes(step.order) ? '✓ 일정에 추가' : '○ 제외됨'}</Text>
                  </Pressable>
                  <Text style={styles.stepTitle}>{step.order}단계</Text>
                  <Text style={styles.inputLabel}>제목</Text>
                  <TextInput
                    value={step.title}
                    onChangeText={(title) => updateDraftStep(step.order, { title })}
                    maxLength={120}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                  <Text style={styles.inputLabel}>설명</Text>
                  <TextInput
                    value={step.description}
                    onChangeText={(description) => updateDraftStep(step.order, { description })}
                    multiline
                    maxLength={1000}
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.stepDescriptionInput]}
                  />
                  <Text style={styles.inputLabel}>예상 시간(분)</Text>
                  <TextInput
                    value={String(step.estimatedMinutes || '')}
                    onChangeText={(value) => updateDraftStep(step.order, { estimatedMinutes: Number(value.replace(/\D/g, '')) })}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="예: 20"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                  <Text style={styles.status}>에너지 {step.energyLevel}</Text>
                </View>
              ))}
              <Text style={styles.inputLabel}>첫 단계 시작 날짜·시간</Text>
              <Text style={styles.inputHelp}>선택한 단계는 입력한 시간부터 순서대로 이어서 배치됩니다.</Text>
              <TextInput
                value={scheduleStart}
                onChangeText={(value) => {
                  setScheduleStart(value);
                  setScheduleConflicts([]);
                  setPendingSchedules(null);
                  setSuggestedStart(null);
                }}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Button
                title={`선택한 ${selectedStepOrders.length}개를 일정으로 저장`}
                onPress={saveSelectedSteps}
                loading={isSavingSchedules}
                disabled={selectedStepOrders.length === 0}
              />
              {scheduleConflicts.length > 0 && pendingSchedules ? (
                <View style={styles.conflictBox}>
                  <Text style={styles.conflictTitle}>기존 일정과 시간이 겹칩니다</Text>
                  {scheduleConflicts.map((conflict) => (
                    <Text key={conflict} style={styles.conflictText}>• {conflict}</Text>
                  ))}
                  <Text style={styles.inputHelp}>시간을 수정하거나, 겹침을 확인한 뒤 그대로 저장할 수 있습니다.</Text>
                  {suggestedStart ? (
                    <Button
                      title={`추천 빈 시간 적용 · ${suggestedStart}`}
                      onPress={() => {
                        setScheduleStart(suggestedStart);
                        setScheduleConflicts([]);
                        setPendingSchedules(null);
                        setSuggestedStart(null);
                      }}
                    />
                  ) : null}
                  <Button
                    title="충돌을 확인했고 그대로 저장"
                    variant="secondary"
                    onPress={() => persistSchedules(pendingSchedules)}
                    loading={isSavingSchedules}
                  />
                </View>
              ) : null}
              {saveMessage ? <Text style={styles.success}>{saveMessage}</Text> : null}
            </View>
          ) : null}
          </> : null}
        </GuideTarget>
      </ScrollView>
    </Screen>
  );
}

function reportHeadline(summary: ProductivitySummary) {
  if (summary.overdue > 0) return `밀린 일정 ${summary.overdue}개를 먼저 정리해 볼까요?`;
  if (summary.scheduled === 0) return '이번 주 첫 시간 블록을 만들어 보세요.';
  if (summary.completionRate >= 80) return '이번 주 계획을 안정적으로 실행하고 있어요.';
  return '완료율보다 다음 한 가지 실행에 집중해 보세요.';
}

function reportAdvice(summary: ProductivitySummary) {
  if (summary.overdue > 0) return '끝내기 어려운 일정은 더 작게 나누거나 현실적인 시간으로 옮기는 것이 좋습니다.';
  if (summary.focusMinutes === 0) return '25분 포커스 세션 하나를 시작하면 실제 집중 시간을 기록할 수 있어요.';
  if (summary.dailyReviews === 0) return '하루 회고를 남기면 계획과 실제 실행의 차이를 다음 주에 개선할 수 있어요.';
  return `현재 ${summary.focusMinutes}분 집중했고 일정 ${summary.completedSchedules}개를 완료했습니다.`;
}

function SummaryCard({ label, value, detail, tone = 'normal' }: { label: string; value: string | number; detail: string; tone?: 'normal' | 'warning' }) {
  return (
    <View style={[styles.summaryCard, tone === 'warning' && styles.warningCard]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
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
  insightCard: { borderRadius: 14, padding: 16, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', gap: 6 },
  insightTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  insightText: { color: colors.muted, lineHeight: 20 },
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
  summaryDetail: { color: colors.muted, fontSize: 11, marginTop: 5 },
  warningCard: { borderColor: '#fbbf24', backgroundColor: '#fffbeb' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 8
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionHeaderText: { flex: 1, gap: 4 },
  inputLabel: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 4 },
  inputHelp: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: -4 },
  description: { color: colors.muted, lineHeight: 20 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    color: colors.text
  },
  goalInput: { minHeight: 88, textAlignVertical: 'top' },
  status: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  result: { gap: 10, marginTop: 4 },
  resultSummary: { color: colors.text, lineHeight: 22, fontWeight: '800' },
  step: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, gap: 4 },
  selectedStep: { borderColor: colors.primary, backgroundColor: '#eff6ff' },
  selectionButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  selection: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  stepDescriptionInput: { minHeight: 72, textAlignVertical: 'top' },
  stepTitle: { color: colors.text, fontWeight: '900' },
  success: { color: '#15803d', fontWeight: '800' },
  conflictBox: { borderWidth: 1, borderColor: colors.warning, borderRadius: 10, padding: 12, gap: 8, backgroundColor: '#fffbeb' },
  conflictTitle: { color: '#92400e', fontWeight: '900' },
  conflictText: { color: '#92400e', fontSize: 13 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
