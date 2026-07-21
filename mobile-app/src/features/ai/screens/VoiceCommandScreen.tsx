import { useAudioRecorder, useAudioRecorderState, AudioModule, RecordingPresets } from 'expo-audio';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import { createInboxItem } from '../../inbox/api/inboxApi';
import { createSchedule } from '../../schedules/api/scheduleApi';
import { createVoiceCommand, getVoiceCommand } from '../api/aiApi';
import type { VoiceCommandResult } from '../dto/ai.dto';
import type { VoiceCommandProps } from '../../../types/navigation';

export function VoiceCommandScreen({ navigation }: VoiceCommandProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [jobId, setJobId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VoiceCommandResult | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!jobId || draft) return;
    const timer = setInterval(async () => {
      try {
        const job = await getVoiceCommand(jobId);
        if (job.status === 'COMPLETED' && job.result) {
          setDraft(job.result);
          setTitle(job.result.title);
          clearInterval(timer);
        } else if (job.status === 'FAILED') {
          setError(job.failureMessage ?? '음성 명령을 처리하지 못했습니다.');
          setJobId(null);
          clearInterval(timer);
        }
      } catch (err) {
        setError(getErrorMessage(err));
        clearInterval(timer);
      }
    }, 1800);
    return () => clearInterval(timer);
  }, [jobId, draft]);

  const toggleRecording = async () => {
    try {
      setError(null);
      if (recorderState.isRecording) {
        await recorder.stop();
        if (!recorder.uri) throw new Error('녹음 파일을 만들지 못했습니다.');
        const accepted = await createVoiceCommand(recorder.uri);
        setJobId(accepted.jobId);
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('마이크 권한이 필요합니다.');
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const confirm = async () => {
    if (!draft || !title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      if (draft.intent === 'CREATE_SCHEDULE' && draft.startAt) {
        const start = new Date(draft.startAt);
        const end = new Date(start.getTime() + (draft.durationMinutes ?? 30) * 60_000);
        await createSchedule({
          title: title.trim(), description: draft.description ?? undefined,
          startAt: localDateTime(start), endAt: localDateTime(end), color: '#2f6fed', repeatType: 'NONE', tagIds: []
        });
      } else {
        await createInboxItem({
          title: title.trim(), description: draft.description ?? undefined,
          estimatedMinutes: draft.durationMinutes ?? undefined, priority: 'MEDIUM', status: 'INBOX'
        });
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>말하면 초안을 만들어요</Text>
      <Text style={styles.help}>예: “내일 오후 7시에 1시간 운동 일정 추가해 줘”</Text>
      <Button
        title={recorderState.isRecording ? `녹음 끝내기 (${Math.round(recorderState.durationMillis / 1000)}초)` : '🎤 녹음 시작'}
        onPress={toggleRecording} disabled={Boolean(jobId) && !draft}
      />
      {jobId && !draft ? <Text style={styles.processing}>음성을 듣고 일정 초안을 만드는 중...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {draft ? (
        <View style={styles.card}>
          <Text style={styles.label}>인식한 말</Text><Text style={styles.transcript}>{draft.transcript}</Text>
          <Text style={styles.label}>제목</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} />
          <Text style={styles.detail}>{draft.intent === 'CREATE_SCHEDULE' ? `일정 · ${draft.startAt} · ${draft.durationMinutes ?? 30}분` : 'Inbox에 저장'}</Text>
          {draft.clarificationQuestion ? <Text style={styles.warning}>{draft.clarificationQuestion}</Text> : null}
          <Text style={styles.confidence}>AI 확신도 {Math.round(draft.confidence * 100)}% · 저장 전 반드시 확인하세요.</Text>
          <Button title={draft.intent === 'CREATE_SCHEDULE' ? '일정 저장' : 'Inbox 저장'} onPress={confirm} loading={isSaving} />
        </View>
      ) : null}
    </Screen>
  );
}

function localDateTime(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 19);
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 8 },
  help: { color: colors.muted, marginBottom: 20, lineHeight: 21 },
  processing: { color: colors.primary, fontWeight: '800', marginTop: 18 },
  error: { color: colors.danger, fontWeight: '700', marginTop: 14 },
  card: { marginTop: 20, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  transcript: { color: colors.text, lineHeight: 21 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 12, color: colors.text, fontWeight: '800' },
  detail: { color: colors.text, fontWeight: '700' },
  warning: { color: colors.warning, fontWeight: '700' },
  confidence: { color: colors.muted, fontSize: 12, marginBottom: 4 }
});
