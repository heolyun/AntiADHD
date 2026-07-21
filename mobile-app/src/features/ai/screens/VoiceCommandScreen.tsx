import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import { createInboxItem } from '../../inbox/api/inboxApi';
import { createSchedule } from '../../schedules/api/scheduleApi';
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
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const polling = useRef(false);
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
    setPhase('READY'); setJobId(null); setDraft(null); setTitle(''); setError(null);
  };

  const close = async () => {
    if (isBusy) return;
    if (recorderState.isRecording) await recorder.stop();
    reset();
    onClose();
  };

  const startRecording = async () => {
    try {
      reset();
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('마이크 권한을 허용해 주세요.');
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('RECORDING');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const finishRecording = async () => {
    try {
      setPhase('UPLOADING');
      await recorder.stop();
      if (!recorder.uri) throw new Error('녹음 파일을 만들지 못했습니다.');
      const accepted = await createVoiceCommand(recorder.uri);
      setJobId(accepted.jobId);
      setPhase('PROCESSING');
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('READY');
    }
  };

  const confirm = async () => {
    if (!draft || !title.trim()) return;
    setIsSaving(true);
    try {
      if (draft.intent === 'CREATE_SCHEDULE' && draft.startAt) {
        const start = new Date(draft.startAt);
        const end = new Date(start.getTime() + (draft.durationMinutes ?? 30) * 60_000);
        await createSchedule({ title: title.trim(), description: draft.description ?? undefined,
          startAt: localDateTime(start), endAt: localDateTime(end), color: '#2f6fed', repeatType: 'NONE', tagIds: [] });
      } else {
        await createInboxItem({ title: title.trim(), description: draft.description ?? undefined,
          estimatedMinutes: draft.durationMinutes ?? undefined, priority: 'MEDIUM', status: 'INBOX' });
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
            <View style={styles.summary}><Text style={styles.summaryText}>{draft.intent === 'CREATE_SCHEDULE' ? `📅 ${formatStart(draft.startAt)} · ${draft.durationMinutes ?? 30}분` : '📥 시간이 없어 Inbox에 저장'}</Text></View>
            {draft.clarificationQuestion ? <Text style={styles.warning}>{draft.clarificationQuestion}</Text> : null}
            <Text style={styles.confidence}>AI 확신도 {Math.round(draft.confidence * 100)}% · 내용을 확인한 뒤 저장하세요.</Text>
            <View style={styles.actions}><View style={styles.action}><Button title="다시 녹음" variant="secondary" onPress={reset} /></View><View style={styles.action}><Button title="확인하고 저장" onPress={confirm} loading={isSaving} /></View></View>
          </View> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function localDateTime(value: Date) { const offset = value.getTimezoneOffset() * 60_000; return new Date(value.getTime() - offset).toISOString().slice(0, 19); }
function formatStart(value: string | null) { return value ? new Date(value).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '시간 미정'; }

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
  warning: { color: colors.warning, fontWeight: '700' }, confidence: { color: colors.muted, fontSize: 12 }, actions: { flexDirection: 'row', gap: 10, marginTop: 6 }, action: { flex: 1 }, error: { color: colors.danger, fontWeight: '700', textAlign: 'center', marginTop: 14 }
});
