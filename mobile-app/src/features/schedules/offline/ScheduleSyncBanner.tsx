import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/constants/theme';
import {
  getScheduleSyncStatus,
  subscribeScheduleSyncStatus,
  syncPendingScheduleMutations,
  type ScheduleSyncStatus,
} from './scheduleOfflineStore';

export function ScheduleSyncBanner() {
  const [status, setStatus] = useState<ScheduleSyncStatus>(getScheduleSyncStatus());

  useEffect(() => subscribeScheduleSyncStatus(setStatus), []);

  if (!status.isSyncing && status.pendingCount === 0 && !status.lastError) return null;

  const title = status.isSyncing
    ? '일정을 동기화하고 있어요'
    : status.pendingCount > 0
      ? `기기에 저장된 변경 ${status.pendingCount}개`
      : '서버 연결을 확인해 주세요';
  const help = status.isSyncing
    ? '완료되면 서버 일정과 자동으로 합쳐집니다.'
    : status.lastError ?? '인터넷과 서버가 연결되면 자동으로 반영됩니다.';

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.help}>{help}</Text>
      </View>
      {!status.isSyncing ? (
        <Pressable onPress={() => void syncPendingScheduleMutations(true)} style={styles.button}>
          <Text style={styles.buttonText}>다시 시도</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderColor: '#B9D1FF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    padding: 13,
  },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 14, fontWeight: '900' },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
