import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createRoutine, deleteRoutine, getRoutines, updateRoutine } from '../api/routineApi';
import type { Routine } from '../dto/routine.dto';
import type { RepeatType } from '../../../shared/types/api';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors, repeatLabels } from '../../../shared/constants/theme';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { getErrorMessage } from '../../../shared/utils/error';

const repeatTypes: RepeatType[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];

export function RoutineManagerScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('DAILY');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAsyncAction();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRoutines(await getRoutines());
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
      await createRoutine({ title: title.trim(), description: description.trim(), repeatType, active: true });
      await refresh();
    });
    if (result !== null) {
      setTitle('');
      setDescription('');
    }
  };

  const toggleActive = async (routine: Routine) => {
    await mutation.run(async () => {
      await updateRoutine(routine.id, {
        title: routine.title,
        description: routine.description ?? '',
        repeatType: routine.repeatType,
        targetTime: routine.targetTime,
        active: !routine.active
      });
      await refresh();
    });
  };

  const visibleError = error || mutation.error;
  const busy = isLoading || mutation.isLoading;

  return (
    <Screen>
      <Header eyebrow="습관 관리" title="루틴" />
      {visibleError ? <Text style={styles.error}>{visibleError}</Text> : null}
      {busy ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>루틴 추가</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="예: 아침 계획 정리" style={styles.input} />
          <TextInput value={description} onChangeText={setDescription} placeholder="설명" style={[styles.input, styles.multiInput]} multiline />
          <View style={styles.segment}>
            {repeatTypes.map((type) => (
              <Pressable key={type} onPress={() => setRepeatType(type)} style={[styles.segmentItem, repeatType === type && styles.segmentActive]}>
                <Text style={[styles.segmentText, repeatType === type && styles.segmentTextActive]}>{repeatLabels[type]}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="루틴 저장" loading={mutation.isLoading} onPress={handleCreate} />
        </View>

        {routines.map((routine) => (
          <View key={routine.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{routine.title}</Text>
              <Text style={styles.rowMeta}>{repeatLabels[routine.repeatType]} · {routine.active ? '활성' : '비활성'}</Text>
            </View>
            <Button title={routine.active ? '끄기' : '켜기'} variant="secondary" onPress={() => toggleActive(routine)} />
            <Button title="삭제" variant="danger" onPress={() => mutation.run(async () => { await deleteRoutine(routine.id); await refresh(); })} />
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
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentItem: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#fff' },
  segmentActive: { borderColor: colors.primary, backgroundColor: '#eff6ff' },
  segmentText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  segmentTextActive: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, backgroundColor: colors.surface },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: '900' },
  rowMeta: { color: colors.muted, marginTop: 4, fontSize: 12, fontWeight: '700' },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
