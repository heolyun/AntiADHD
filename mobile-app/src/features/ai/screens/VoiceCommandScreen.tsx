import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import { createInboxItem } from '../../inbox/api/inboxApi';
import { createSchedule } from '../../schedules/api/scheduleApi';
import { createRoutine, materializeRoutines } from '../../routines/api/routineApi';
import { createVoiceCommand, getVoiceCommand } from '../api/aiApi';
import type { VoiceCommandResult } from '../dto/ai.dto';

type Phase = 'READY' | 'RECORDING' | 'UPLOADING' | 'PROCESSING' | 'REVIEW';

export function VoiceCommandModal({
  visible,
  onClose,
  onSaved
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<Phase>('READY');
  const [jobId, setJobId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VoiceCommandResult | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [repeatType, setRepeatType] = useState<'NONE' | 'DAILY'>('NONE');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const polling = useRef(false);
  const recordingReady = useRef(false);
  const finishing = useRef(false);
  const isBusy = phase === 'UPLOADING' || phase === 'PROCESSING';

  useEffect(() => {
    if (!visible || !jobId || draft) return;
    let cancelled = false;
    const poll = async () => {
      if (polling.current || cancelled) return;
      polling.current = true;
      try {
        const job = await getVoiceCommand(jobId);
        if (cancelled) return;
        if (job.status === 'COMPLETED' && job.result) {
          setDraft(job.result);
          setTitle(job.result.title);
          if (job.result.startAt) {
            const start = new Date(job.result.startAt);
            setStartDate(localDate(start));
            setStartTime(localTime(start));
          } else {
            setStartDate(job.result.startDate ?? '');
            setStartTime(job.result.startTime ?? '');
          }
          setDurationMinutes(String(job.result.durationMinutes ?? 30));
          setRepeatType(job.result.repeatType ?? 'NONE');
          setPhase('REVIEW');
          setError(null);
        } else if (job.status === 'FAILED') {
          setError(job.failureMessage ?? '음성 명령을 처리하지 못했습니다.');
          setJobId(null);
          setPhase('READY');
        }
      } catch {
        // A temporary timeout must not discard a job that is still running on the server.
      } finally {
        polling.current = false;
      }
    };
    poll();
    const timer = setInterval(poll, 2500);
    return () => { cancelled = true; clearInterval(timer); };
  }, [visible, jobId, draft]);

  const reset = () => {
    recordingReady.current = false;
    finishing.current = false;
    setPhase('READY'); setJobId(null); setDraft(null); setTitle(''); setStartDate(''); setStartTime(''); setDurationMinutes('30'); setRepeatType('NONE'); setError(null);
  };

  const close = async () => {
    if (isBusy) return;
    if (recordingReady.current) {
      recordingReady.current = false;
      try { await recorder.stop(); } catch { /* Android may already have released it. */ }
    }
    reset();
    onClose();
  };

  const startRecording = async () => {
    if (recordingReady.current || finishing.current) return;
    try {
      reset();
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('마이크 권한을 허용해 주세요.');
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingReady.current = true;
      setPhase('RECORDING');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const finishRecording = async () => {
    if (!recordingReady.current || finishing.current) return;
    if (recorderState.durationMillis < 700) {
      setError('1초 이상 말한 뒤 녹음을 완료해 주세요.');
      return;
    }
    finishing.current = true;
    try {
      setPhase('UPLOADING');
      await recorder.stop();
      recordingReady.current = false;
      if (!recorder.uri) throw new Error('녹음 파일을 만들지 못했습니다.');
      const accepted = await createVoiceCommand(recorder.uri);
      setJobId(accepted.jobId);
      setPhase('PROCESSING');
    } catch (err) {
      recordingReady.current = false;
      const message = getErrorMessage(err);
      setError(message.includes('IllegalStateException')
        ? '녹음 상태가 초기화되었습니다. 통화 중이거나 다른 앱이 마이크를 사용 중인지 확인한 뒤 다시 시도해 주세요.'
        : message);
      setPhase('READY');
    } finally {
      finishing.current = false;
    }
  };

  const confirm = async () => {
    if (!draft || !title.trim()) return;
    const minutes = Number(durationMinutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
      setError('소요 시간은 5분에서 480분 사이로 입력해 주세요.');
      return;
    }
    setIsSaving(true);
    try {
      if (draft.intent === 'CREATE_SCHEDULE') {
        const start = new Date(`${startDate}T${startTime}:00`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{2}:\d{2}$/.test(startTime) || Number.isNaN(start.getTime())) {
          throw new Error('날짜와 시간을 YYYY-MM-DD, HH:mm 형식으로 확인해 주세요.');
        }
        if (repeatType === 'DAILY') {
          await createRoutine({ title: title.trim(), description: draft.description ?? undefined,
            repeatType: 'DAILY', targetTime: startTime, durationMinutes: minutes, active: true });
          await materializeRoutines(startDate);
        } else {
          const end = new Date(start.getTime() + minutes * 60_000);
          await createSchedule({ title: title.trim(), description: draft.description ?? undefined,
            startAt: localDateTime(start), endAt: localDateTime(end), color: '#2f6fed', repeatType: 'NONE', tagIds: [] });
        }
      } else {
        await createInboxItem({ title: title.trim(), description: draft.description ?? undefined,
          estimatedMinutes: minutes, priority: 'MEDIUM', status: 'INBOX' });
      }
      reset();
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={phase === 'READY' || phase === 'REVIEW' ? close : undefined} />
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <Text style={styles.title}>음성으로 일정 추가</Text>
            <Pressable onPress={close} hitSlop={12} disabled={isBusy}><Text style={[styles.close, isBusy && styles.closeDisabled]}>×</Text></Pressable>
          </View>

          {phase === 'READY' ? <>
            <Text style={styles.help}>버튼을 누르고 자연스럽게 말해 주세요.</Text>
            <View style={styles.example}><Text style={styles.exampleText}>“내일 오후 7시에 한 시간 운동 추가해 줘”</Text></View>
            <Pressable style={styles.mic} onPress={startRecording}><Text style={styles.micIcon}>🎤</Text></Pressable>
            <Text style={styles.centerHelp}>마이크를 눌러 녹음 시작</Text>
          </> : null}

          {phase === 'RECORDING' ? <>
            <View style={styles.recordingBadge}><View style={styles.redDot} /><Text style={styles.recordingText}>듣고 있어요 · {Math.round(recorderState.durationMillis / 1000)}초</Text></View>
            <Text style={styles.bigHelp}>말을 마치면 아래 버튼을 누르세요.</Text>
            <Button title="녹음 완료하고 일정 만들기" onPress={finishRecording} />
          </> : null}

          {phase === 'UPLOADING' || phase === 'PROCESSING' ? <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.bigHelp}>{phase === 'UPLOADING' ? '녹음을 보내는 중...' : 'AI가 일정 초안을 정리하는 중...'}</Text>
            <Text style={styles.help}>창을 닫지 말고 잠시 기다려 주세요.</Text>
          </View> : null}

          {phase === 'REVIEW' && draft ? <View style={styles.review}>
            <Text style={styles.step}>마지막 단계 · 저장 전 확인</Text>
            <Text style={styles.label}>인식한 말</Text><Text style={styles.transcript}>{draft.transcript}</Text>
            <Text style={styles.label}>일정 제목</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} />
            {draft.intent === 'CREATE_SCHEDULE' ? <>
              <Text style={styles.label}>날짜와 시작 시간</Text>
              <View style={styles.fieldRow}>
                <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" style={[styles.input, styles.field]} />
                <TextInput value={startTime} onChangeText={setStartTime} placeholder="HH:mm" keyboardType="numbers-and-punctuation" style={[styles.input, styles.field]} />
              </View>
            </> : <View style={styles.summary}><Text style={styles.summaryText}>📥 시간이 없어 Inbox에 저장</Text></View>}
            <Text style={styles.label}>소요 시간(분)</Text>
            <TextInput value={durationMinutes} onChangeText={(value) => setDurationMinutes(value.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} style={styles.input} />
            {draft.intent === 'CREATE_SCHEDULE' ? <>
              <Text style={styles.label}>반복</Text>
              <View style={styles.fieldRow}>
                <View style={styles.field}><Button title="한 번만" variant={repeatType === 'NONE' ? 'primary' : 'secondary'} onPress={() => setRepeatType('NONE')} /></View>
                <View style={styles.field}><Button title="매일 반복" variant={repeatType === 'DAILY' ? 'primary' : 'secondary'} onPress={() => setRepeatType('DAILY')} /></View>
              </View>
            </> : null}
            {draft.clarificationQuestion ? <Text style={styles.warning}>{draft.clarificationQuestion}</Text> : null}
            <Text style={styles.confidence}>AI 확신도 {Math.round(draft.confidence * 100)}% · 내용을 확인한 뒤 저장하세요.</Text>
            <View style={styles.actions}><View style={styles.action}><Button title="다시 녹음" variant="secondary" onPress={reset} /></View><View style={styles.action}><Button title={repeatType === 'DAILY' ? '매일 루틴으로 저장' : '확인하고 저장'} onPress={confirm} loading={isSaving} /></View></View>
          </View> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function localDateTime(value: Date) { const offset = value.getTimezoneOffset() * 60_000; return new Date(value.getTime() - offset).toISOString().slice(0, 19); }
function localDate(value: Date) { return localDateTime(value).slice(0, 10); }
function localTime(value: Date) { return localDateTime(value).slice(11, 16); }

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.58)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 520, backgroundColor: colors.surface, borderRadius: 22, padding: 22, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text }, close: { fontSize: 30, color: colors.muted, lineHeight: 30 }, closeDisabled: { opacity: 0.25 },
  help: { color: colors.muted, lineHeight: 21, textAlign: 'center' }, centerHelp: { color: colors.muted, textAlign: 'center', marginTop: 10, fontWeight: '700' },
  example: { backgroundColor: colors.background, borderRadius: 12, padding: 14, marginVertical: 18 }, exampleText: { color: colors.text, textAlign: 'center', fontWeight: '700' },
  mic: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, micIcon: { fontSize: 38 },
  recordingBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginVertical: 26 }, redDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger }, recordingText: { color: colors.danger, fontWeight: '900', fontSize: 17 },
  bigHelp: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 20 }, loadingBox: { paddingVertical: 28, gap: 14 },
  review: { gap: 10 }, step: { color: colors.primary, fontWeight: '900', marginBottom: 4 }, label: { color: colors.muted, fontSize: 12, fontWeight: '800' }, transcript: { color: colors.text, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text, fontWeight: '800' }, summary: { backgroundColor: colors.background, borderRadius: 10, padding: 12 }, summaryText: { color: colors.text, fontWeight: '800' },
  fieldRow: { flexDirection: 'row', gap: 10 }, field: { flex: 1 },
  warning: { color: colors.warning, fontWeight: '700' }, confidence: { color: colors.muted, fontSize: 12 }, actions: { flexDirection: 'row', gap: 10, marginTop: 6 }, action: { flex: 1 }, error: { color: colors.danger, fontWeight: '700', textAlign: 'center', marginTop: 14 }
});
