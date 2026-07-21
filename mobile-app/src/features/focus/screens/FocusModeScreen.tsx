import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { completeFocusSession, createFocusSession } from '../api/focusApi';
import type { FocusSession } from '../dto/focus.dto';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { toLocalDateTimeValue } from '../../../shared/utils/date';
import { getErrorMessage } from '../../../shared/utils/error';
import type { FocusModeProps } from '../../../types/navigation';

const presets = [25, 50, 90];

export function FocusModeScreen({ navigation, route }: FocusModeProps) {
  const initialMinutes = Math.max(1, Math.min(480, route.params?.plannedMinutes ?? 25));
  const [title, setTitle] = useState(route.params?.title ?? '집중 작업');
  const [plannedMinutes, setPlannedMinutes] = useState(initialMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    if (remainingSeconds <= 0) {
      setIsRunning(false);
      completeSession(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  const progress = useMemo(() => {
    const total = plannedMinutes * 60;
    return total === 0 ? 0 : ((total - remainingSeconds) / total) * 100;
  }, [plannedMinutes, remainingSeconds]);

  function selectPreset(minutes: number) {
    if (isRunning || session) return;
    setPlannedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  }

  async function startSession() {
    if (!title.trim()) {
      setError('Focus 제목을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const created = await createFocusSession({
        title: title.trim(),
        startedAt: toLocalDateTimeValue(new Date()),
        plannedMinutes,
        completed: false,
        note: ''
      });
      setSession(created);
      setIsRunning(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function completeSession(autoCompleted = false) {
    if (!session) return;

    setIsSaving(true);
    setError(null);
    try {
      await completeFocusSession(session.id, {
        endedAt: toLocalDateTimeValue(new Date()),
        note: autoCompleted ? '타이머가 종료되어 자동 완료되었습니다.' : '사용자가 Focus 세션을 완료했습니다.'
      });
      setIsRunning(false);
      Alert.alert('Focus 완료', 'Focus 세션이 저장되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function resetSession() {
    if (session) {
      Alert.alert('진행 중인 Focus', '이미 시작된 세션은 완료로 저장하거나 뒤로 이동해 목록에서 관리해주세요.');
      return;
    }
    setIsRunning(false);
    setRemainingSeconds(plannedMinutes * 60);
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <Screen>
      <Header eyebrow="Focus Mode" title="방해 없이 한 블록" />
      <View style={styles.card}>
        <Text style={styles.label}>Focus 제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          editable={!session}
          placeholder="예: 보고서 작성"
        />
        <Text style={styles.label}>시간 선택</Text>
        <View style={styles.presets}>
          {presets.map((minutesValue) => (
            <Pressable
              key={minutesValue}
              onPress={() => selectPreset(minutesValue)}
              style={[styles.preset, plannedMinutes === minutesValue && styles.activePreset]}
            >
              <Text style={[styles.presetText, plannedMinutes === minutesValue && styles.activePresetText]}>
                {minutesValue}분
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timer}>{minutes}:{seconds}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.helper}>{session ? 'Focus 세션이 기록 중입니다.' : '시작하면 Focus 세션이 서버에 저장됩니다.'}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {!session ? (
          <Button title="Focus 시작" loading={isSaving} onPress={startSession} />
        ) : (
          <>
            <Button title={isRunning ? '일시정지' : '다시 시작'} variant="secondary" onPress={() => setIsRunning((value) => !value)} />
            <Button title="완료하고 저장" loading={isSaving} onPress={() => completeSession(false)} />
          </>
        )}
        <Button title="초기화" variant="secondary" onPress={resetSession} disabled={isSaving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 10,
    marginBottom: 16
  },
  label: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: '#fff'
  },
  presets: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface
  },
  activePreset: { borderColor: colors.primary, backgroundColor: colors.primary },
  presetText: { color: colors.muted, fontWeight: '900' },
  activePresetText: { color: '#fff' },
  timerCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 22,
    backgroundColor: colors.surface,
    gap: 14
  },
  timer: { color: colors.text, fontSize: 58, fontWeight: '900' },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  helper: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  actions: { gap: 10, marginTop: 16 },
  error: { color: colors.danger, fontWeight: '700', marginTop: 12 }
});

