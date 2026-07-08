import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createDailyReview, deleteDailyReview, getDailyReviews } from '../api/dailyReviewApi';
import type { DailyReview } from '../dto/dailyReview.dto';
import { Button } from '../../../shared/components/Button';
import { Header } from '../../../shared/components/Header';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/constants/theme';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { toDateKey } from '../../../shared/utils/date';
import { getErrorMessage } from '../../../shared/utils/error';

export function DailyReviewScreen() {
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [reviewDate, setReviewDate] = useState(toDateKey(new Date()));
  const [mood, setMood] = useState('');
  const [summary, setSummary] = useState('');
  const [accomplishment, setAccomplishment] = useState('');
  const [improvement, setImprovement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAsyncAction();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setReviews(await getDailyReviews());
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
    const result = await mutation.run(async () => {
      await createDailyReview({
        reviewDate,
        mood: mood.trim(),
        summary: summary.trim(),
        accomplishment: accomplishment.trim(),
        improvement: improvement.trim()
      });
      await refresh();
    });
    if (result !== null) {
      setMood('');
      setSummary('');
      setAccomplishment('');
      setImprovement('');
    }
  };

  const visibleError = error || mutation.error;
  const busy = isLoading || mutation.isLoading;

  return (
    <Screen>
      <Header eyebrow="하루 회고" title="Daily Review" />
      {visibleError ? <Text style={styles.error}>{visibleError}</Text> : null}
      {busy ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘 회고 작성</Text>
          <TextInput value={reviewDate} onChangeText={setReviewDate} placeholder="YYYY-MM-DD" style={styles.input} />
          <TextInput value={mood} onChangeText={setMood} placeholder="기분" style={styles.input} />
          <TextInput value={summary} onChangeText={setSummary} placeholder="오늘 요약" style={[styles.input, styles.multiInput]} multiline />
          <TextInput value={accomplishment} onChangeText={setAccomplishment} placeholder="잘한 점" style={[styles.input, styles.multiInput]} multiline />
          <TextInput value={improvement} onChangeText={setImprovement} placeholder="개선할 점" style={[styles.input, styles.multiInput]} multiline />
          <Button title="회고 저장" loading={mutation.isLoading} onPress={handleCreate} />
        </View>

        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.rowTitle}>{review.reviewDate}</Text>
              <Button title="삭제" variant="danger" onPress={() => mutation.run(async () => { await deleteDailyReview(review.id); await refresh(); })} />
            </View>
            {review.mood ? <Text style={styles.rowMeta}>기분: {review.mood}</Text> : null}
            {review.summary ? <Text style={styles.body}>{review.summary}</Text> : null}
            {review.accomplishment ? <Text style={styles.body}>잘한 점: {review.accomplishment}</Text> : null}
            {review.improvement ? <Text style={styles.body}>개선할 점: {review.improvement}</Text> : null}
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
  reviewCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 8, backgroundColor: colors.surface },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, color: colors.text, backgroundColor: '#fff' },
  multiInput: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' },
  rowTitle: { flex: 1, color: colors.text, fontWeight: '900' },
  rowMeta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  body: { color: colors.text, lineHeight: 21 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '700' }
});
