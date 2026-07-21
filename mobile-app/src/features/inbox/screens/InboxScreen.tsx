import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import { createInboxItem, deleteInboxItem, getInboxItems, updateInboxItem } from '../api/inboxApi';
import type { InboxItem, InboxPriority } from '../dto/inbox.dto';

const priorityLabels: Record<InboxPriority, string> = { LOW: '낮음', MEDIUM: '보통', HIGH: '높음' };

export function InboxScreen() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [priority, setPriority] = useState<InboxPriority>('MEDIUM');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await getInboxItems());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const addItem = useCallback(async () => {
    const trimmedTitle = title.trim();
    const minutes = estimatedMinutes ? Number(estimatedMinutes) : undefined;
    if (!trimmedTitle) return;
    if (minutes !== undefined && (!Number.isInteger(minutes) || minutes < 1 || minutes > 480)) {
      setError('예상 시간은 1~480분 사이로 입력해 주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createInboxItem({ title: trimmedTitle, estimatedMinutes: minutes, priority, status: 'INBOX' });
      setTitle('');
      setEstimatedMinutes('');
      setPriority('MEDIUM');
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [estimatedMinutes, priority, refresh, title]);

  const toggleDone = useCallback(async (item: InboxItem) => {
    setError(null);
    try {
      await updateInboxItem(item.id, {
        title: item.title,
        description: item.description ?? undefined,
        estimatedMinutes: item.estimatedMinutes ?? undefined,
        priority: item.priority,
        status: item.status === 'DONE' ? 'INBOX' : 'DONE'
      });
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    setError(null);
    try {
      await deleteInboxItem(id);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [refresh]);

  const openItems = items.filter((item) => item.status !== 'DONE');
  const doneItems = items.filter((item) => item.status === 'DONE');

  return (
    <Screen>
      <Header eyebrow="빠른 입력" title="Inbox" />
      <View style={styles.captureCard}>
        <Text style={styles.help}>시간을 정하지 않아도 괜찮아요. 먼저 떠오른 일을 저장하세요.</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={addItem}
          placeholder="예: 포트폴리오 README 보완"
          placeholderTextColor={colors.muted}
          maxLength={120}
          returnKeyType="done"
          style={styles.input}
        />
        <TextInput
          value={estimatedMinutes}
          onChangeText={(value) => setEstimatedMinutes(value.replace(/\D/g, ''))}
          placeholder="예상 시간(분) · 선택"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={3}
          style={styles.input}
        />
        <View style={styles.priorityRow}>
          {(Object.keys(priorityLabels) as InboxPriority[]).map((value) => (
            <View key={value} style={styles.priorityButton}>
              <Button
                title={priorityLabels[value]}
                variant={priority === value ? 'primary' : 'secondary'}
                onPress={() => setPriority(value)}
              />
            </View>
          ))}
        </View>
        <Button title="Inbox에 저장" onPress={addItem} loading={isLoading} disabled={!title.trim()} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionTitle}>정리할 항목 {openItems.length}</Text>
        {openItems.length === 0 ? <Text style={styles.empty}>Inbox가 비어 있습니다.</Text> : null}
        {openItems.map((item) => (
          <InboxCard key={item.id} item={item} onToggle={toggleDone} onDelete={remove} />
        ))}
        {doneItems.length > 0 ? <Text style={styles.sectionTitle}>완료 {doneItems.length}</Text> : null}
        {doneItems.map((item) => (
          <InboxCard key={item.id} item={item} onToggle={toggleDone} onDelete={remove} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function InboxCard({ item, onToggle, onDelete }: {
  item: InboxItem;
  onToggle: (item: InboxItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <View style={[styles.itemCard, item.status === 'DONE' && styles.doneCard]}>
      <Text style={[styles.itemTitle, item.status === 'DONE' && styles.doneText]}>{item.title}</Text>
      <Text style={styles.meta}>
        우선순위 {priorityLabels[item.priority]}{item.estimatedMinutes ? ` · 약 ${item.estimatedMinutes}분` : ''}
      </Text>
      <View style={styles.itemActions}>
        <View style={styles.action}><Button title={item.status === 'DONE' ? '되돌리기' : '완료'} variant="secondary" onPress={() => onToggle(item)} /></View>
        <View style={styles.action}><Button title="삭제" variant="danger" onPress={() => onDelete(item.id)} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  captureCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, backgroundColor: colors.surface, gap: 10, marginBottom: 14 },
  help: { color: colors.muted, lineHeight: 20 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.background, color: colors.text },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityButton: { flex: 1 },
  error: { color: colors.danger, fontWeight: '700', marginBottom: 10 },
  list: { gap: 10, paddingBottom: 28 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  itemCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, backgroundColor: colors.surface, gap: 8 },
  doneCard: { opacity: 0.65 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  doneText: { textDecorationLine: 'line-through' },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  itemActions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 }
});
