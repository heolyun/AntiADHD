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
  const [targetTime, setTargetTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('30');
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
    const minutes = Number(durationMinutes);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(targetTime)) {
      setError('실행 시간은 HH:mm 형식으로 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) {
      setError('루틴 시간은 1~480분 사이로 입력해 주세요.');
      return;
    }
    const result = await mutation.run(async () => {
      await createRoutine({ title: title.trim(), description: description.trim(), repeatType, targetTime, durationMinutes: minutes, active: true });
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
        durationMinutes: routine.durationMinutes,
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
          <View style={styles.timeRow}>
            <TextInput value={targetTime} onChangeText={setTargetTime} placeholder="09:00" maxLength={5} style={[styles.input, styles.timeInput]} />
            <TextInput value={durationMinutes} onChangeText={(value) => setDurationMinutes(value.replace(/\D/g, ''))} placeholder="30분" keyboardType="number-pad" maxLength={3} style={[styles.input, styles.timeInput]} />
          </View>
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
              <Text style={styles.rowMeta}>{repeatLabels[routine.repeatType]} · {routine.targetTime?.slice(0, 5) ?? '09:00'} · {routine.durationMinutes}분 · {routine.active ? '활성' : '비활성'}</Text>
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
  timeRow: { flexDirection: 'row', gap: 8 },
  timeInput: { flex: 1 },
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
