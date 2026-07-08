import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createCategory, deleteCategory, getCategories } from '../api/categoryApi';
import type { Category } from '../dto/category.dto';
import { createTag, deleteTag, getTags } from '../../tags/api/tagApi';
import type { Tag } from '../../tags/dto/tag.dto';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { getErrorMessage } from '../../../shared/utils/error';

export function CategoryTagManagerScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#2563eb');
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#64748b');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAsyncAction();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextCategories, nextTags] = await Promise.all([getCategories(), getTags()]);
      setCategories(nextCategories);
      setTags(nextTags);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    const result = await mutation.run(async () => {
      await createCategory({ name: categoryName.trim(), color: categoryColor.trim() || '#2563eb' });
      await refresh();
    });
    if (result !== null) setCategoryName('');
  };

  const handleCreateTag = async () => {
    if (!tagName.trim()) return;
    const result = await mutation.run(async () => {
      await createTag({ name: tagName.trim(), color: tagColor.trim() || '#64748b' });
      await refresh();
    });
    if (result !== null) setTagName('');
  };

  const visibleError = error || mutation.error;
  const busy = isLoading || mutation.isLoading;

  return (
    <Screen>
      <Header eyebrow="분류 관리" title="카테고리와 태그" />
      {visibleError ? <Text style={styles.error}>{visibleError}</Text> : null}
      {busy ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리 추가</Text>
          <TextInput value={categoryName} onChangeText={setCategoryName} placeholder="예: 업무" style={styles.input} />
          <TextInput value={categoryColor} onChangeText={setCategoryColor} placeholder="#2563eb" style={styles.input} autoCapitalize="none" />
          <Button title="카테고리 저장" loading={mutation.isLoading} onPress={handleCreateCategory} />
        </View>

        <View style={styles.list}>
          {categories.map((category) => (
            <View key={category.id} style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: category.color }]} />
              <Text style={styles.rowTitle}>{category.name}</Text>
              <Button title="삭제" variant="danger" onPress={() => mutation.run(async () => { await deleteCategory(category.id); await refresh(); })} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>태그 추가</Text>
          <TextInput value={tagName} onChangeText={setTagName} placeholder="예: 집중" style={styles.input} />
          <TextInput value={tagColor} onChangeText={setTagColor} placeholder="#64748b" style={styles.input} autoCapitalize="none" />
          <Button title="태그 저장" loading={mutation.isLoading} onPress={handleCreateTag} />
        </View>

        <View style={styles.list}>
          {tags.map((tag) => (
            <View key={tag.id} style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: tag.color }]} />
              <Text style={styles.rowTitle}>#{tag.name}</Text>
              <Button title="삭제" variant="danger" onPress={() => mutation.run(async () => { await deleteTag(tag.id); await refresh(); })} />
            </View>
          ))}
        </View>
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
  list: { gap: 8 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, backgroundColor: colors.surface },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  rowTitle: { flex: 1, color: colors.text, fontWeight: '900' },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
