import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Screen } from '../../../shared/components/Screen';
import { colors, repeatLabels, scheduleColors } from '../../../shared/constants/theme';
import type { ScheduleEditProps } from '../../../types/navigation';
import type { RepeatType } from '../dto/schedule.dto';
import { useScheduleEditor } from '../hooks/useScheduleEditor';

const repeatTypes: RepeatType[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];

export function ScheduleEditScreen({ navigation, route }: ScheduleEditProps) {
  const scheduleId = route.params?.scheduleId;
  const { form, setForm, isLoading, isSaving, error, save } = useScheduleEditor(scheduleId);

  async function handleSave() {
    await save();
    navigation.goBack();
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>{scheduleId ? 'Edit schedule' : 'New schedule'}</Text>
        {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
        <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Notes"
          multiline
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
        />
        <Text style={styles.label}>Start</Text>
        <TextInput style={styles.input} value={form.startAt} onChangeText={(startAt) => setForm({ ...form, startAt })} />
        <Text style={styles.label}>End</Text>
        <TextInput style={styles.input} value={form.endAt} onChangeText={(endAt) => setForm({ ...form, endAt })} />
        <Text style={styles.label}>Repeat</Text>
        <View style={styles.chips}>
          {repeatTypes.map((type) => (
            <Text key={type} onPress={() => setForm({ ...form, repeatType: type })} style={[styles.chip, form.repeatType === type && styles.activeChip]}>
              {repeatLabels[type]}
            </Text>
          ))}
        </View>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colors}>
          {scheduleColors.map((color) => (
            <Text key={color} onPress={() => setForm({ ...form, color })} style={[styles.color, { backgroundColor: color }, form.color === color && styles.activeColor]} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={scheduleId ? 'Save' : 'Create'} loading={isSaving} onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 6 },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.surface, color: colors.text },
  textarea: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  label: { color: colors.muted, fontWeight: '900', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.muted,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    fontWeight: '800'
  },
  activeChip: { color: '#fff', borderColor: colors.primary, backgroundColor: colors.primary },
  colors: { flexDirection: 'row', gap: 12 },
  color: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  activeColor: { borderColor: colors.text },
  error: { color: colors.danger, fontWeight: '700' },
  muted: { color: colors.muted }
});
