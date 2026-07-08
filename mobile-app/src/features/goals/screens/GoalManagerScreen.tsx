import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createGoal, deleteGoal, getGoals, updateGoal } from '../api/goalApi';
import type { Goal } from '../dto/goal.dto';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { getErrorMessage } from '../../../shared/utils/error';

export function GoalManagerScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAsyncAction();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setGoals(await getGoals());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const handleCreate = async () => {
    if (!title.trim()) return;
    const result = await mutation.run(async () => {
      await createGoal({
        title: title.trim(),
        description: description.trim(),
        progress: Math.min(100, Math.max(0, Number(progress) || 0)),
        status: 'IN_PROGRESS'
      });
      await refresh();
    });
    if (result !== null) {
      setTitle('');
      setDescription('');
      setProgress('0');
    }
  };

  const completeGoal = async (goal: Goal) => {
    await mutation.run(async () => {
      await updateGoal(goal.id, {
        title: goal.title,
        description: goal.description ?? '',
        targetDate: goal.targetDate,
        progress: 100,
        status: 'DONE'
      });
      await refresh();
    });
  };

  const visibleError = error || mutation.error;
  const busy = isLoading || mutation.isLoading;

  return (
    <Screen>
      <Header eyebrow="방향 관리" title="목표" />
      {visibleError ? <Text style={styles.error}>{visibleError}</Text> : null}
      {busy ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>목표 추가</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="예: 포트폴리오 MVP 완성" style={styles.input} />
          <TextInput value={description} onChangeText={setDescription} placeholder="설명" style={[styles.input, styles.multiInput]} multiline />
          <TextInput value={progress} onChangeText={setProgress} placeholder="진행률 0-100" keyboardType="numeric" style={styles.input} />
          <Button title="목표 저장" loading={mutation.isLoading} onPress={handleCreate} />
        </View>

        {goals.map((goal) => (
          <View key={goal.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{goal.title}</Text>
              <Text style={styles.rowMeta}>{goal.status} · {goal.progress}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
              </View>
            </View>
            {goal.status !== 'DONE' ? <Button title="완료" variant="secondary" onPress={() => completeGoal(goal)} /> : null}
            <Button title="삭제" variant="danger" onPress={() => mutation.run(async () => { await deleteGoal(goal.id); await refresh(); })} />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginBottom: 12 },
  content: { gap: 14, paddingBottom: 28 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 10, backgroundColor: colors.surface },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, color: colors.text, backgroundColor: '#fff' },
  multiInput: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, backgroundColor: colors.surface },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: '900' },
  rowMeta: { color: colors.muted, marginTop: 4, fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#e2e8f0', marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: colors.primary },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
