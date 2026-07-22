import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCategories } from '../../categories/api/categoryApi';
import type { Category } from '../../categories/dto/category.dto';
import { getTags } from '../../tags/api/tagApi';
import type { Tag } from '../../tags/dto/tag.dto';
import { Button } from '../../../shared/components/Button';
import { Screen } from '../../../shared/components/Screen';
import { colors, repeatLabels, scheduleColors } from '../../../shared/constants/theme';
import { getErrorMessage } from '../../../shared/utils/error';
import type { RepeatType } from '../../../shared/types/api';
import type { ScheduleEditProps } from '../../../types/navigation';
import { useScheduleEditor } from '../hooks/useScheduleEditor';
import { deleteInboxItem } from '../../inbox/api/inboxApi';

const repeatTypes: RepeatType[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];

export function ScheduleEditScreen({ navigation, route }: ScheduleEditProps) {
  const scheduleId = route.params?.scheduleId;
  const selectedDate = route.params?.selectedDate;
  const { form, setForm, isLoading, isSaving, error, save } = useScheduleEditor(scheduleId, selectedDate, {
    title: route.params?.draftTitle,
    description: route.params?.draftDescription,
    durationMinutes: route.params?.durationMinutes
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      setMetaError(null);
      try {
        const [nextCategories, nextTags] = await Promise.all([getCategories(), getTags()]);
        setCategories(nextCategories);
        setTags(nextTags);
      } catch (err) {
        setMetaError(getErrorMessage(err));
      }
    }

    loadMeta();
  }, []);

  async function handleSave() {
    await save();
    if (route.params?.inboxItemId) await deleteInboxItem(route.params.inboxItemId);
    navigation.goBack();
  }

  function toggleTag(tagId: number) {
    const hasTag = form.tagIds.includes(tagId);
    setForm({
      ...form,
      tagIds: hasTag ? form.tagIds.filter((id) => id !== tagId) : [...form.tagIds, tagId]
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{scheduleId ? '일정 수정' : '새 일정'}</Text>
          <Text style={styles.title}>{scheduleId ? '타임블록 수정' : '타임블록 등록'}</Text>
        </View>

        {isLoading ? <Text style={styles.muted}>일정을 불러오는 중입니다...</Text> : null}
        {metaError ? <Text style={styles.error}>{metaError}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            testID="schedule-title"
            style={styles.input}
            placeholder="예: 오전 집중 업무"
            value={form.title}
            onChangeText={(title) => setForm({ ...form, title })}
          />

          <Text style={styles.label}>메모</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="필요한 준비물이나 목표를 적어두세요."
            multiline
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>시간</Text>
          <TextInput style={styles.input} value={form.startAt} onChangeText={(startAt) => setForm({ ...form, startAt })} />
          <TextInput style={styles.input} value={form.endAt} onChangeText={(endAt) => setForm({ ...form, endAt })} />
          <Text style={styles.hint}>형식: YYYY-MM-DDTHH:mm:ss</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>반복</Text>
          <View style={styles.chips}>
            {repeatTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setForm({ ...form, repeatType: type })}
                style={[styles.chip, form.repeatType === type && styles.activeChip]}
              >
                <Text style={[styles.chipText, form.repeatType === type && styles.activeChipText]}>{repeatLabels[type]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>색상</Text>
          <View style={styles.colors}>
            {scheduleColors.map((color) => (
              <Pressable
                key={color}
                onPress={() => setForm({ ...form, color })}
                style={[styles.color, { backgroundColor: color }, form.color === color && styles.activeColor]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>카테고리</Text>
          <View style={styles.chips}>
            <Pressable
              onPress={() => setForm({ ...form, categoryId: null })}
              style={[styles.chip, form.categoryId === null && styles.activeChip]}
            >
              <Text style={[styles.chipText, form.categoryId === null && styles.activeChipText]}>없음</Text>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setForm({ ...form, categoryId: category.id })}
                style={[styles.chip, form.categoryId === category.id && styles.activeChip]}
              >
                <View style={[styles.smallDot, { backgroundColor: category.color }]} />
                <Text style={[styles.chipText, form.categoryId === category.id && styles.activeChipText]}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>태그</Text>
          <View style={styles.chips}>
            {tags.length === 0 ? <Text style={styles.muted}>등록된 태그가 없습니다.</Text> : null}
            {tags.map((tag) => {
              const selected = form.tagIds.includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => toggleTag(tag.id)}
                  style={[styles.chip, selected && styles.activeChip]}
                >
                  <View style={[styles.smallDot, { backgroundColor: tag.color }]} />
                  <Text style={[styles.chipText, selected && styles.activeChipText]}>#{tag.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button testID="schedule-submit" title={scheduleId ? '저장' : '등록'} loading={isSaving} onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, paddingBottom: 32 },
  header: { gap: 4, marginBottom: 4 },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    backgroundColor: colors.surface
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    color: colors.text
  },
  textarea: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  label: { color: colors.text, fontWeight: '900' },
  hint: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  activeChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '900' },
  activeChipText: { color: '#fff' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  color: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: 'transparent' },
  activeColor: { borderColor: colors.text },
  smallDot: { width: 8, height: 8, borderRadius: 4 },
  error: { color: colors.danger, fontWeight: '700' },
  muted: { color: colors.muted, fontWeight: '700' }
});
