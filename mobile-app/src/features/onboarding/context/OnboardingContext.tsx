import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';

type OnboardingContextValue = {
  openGuide: () => void;
};

type GuideStep = {
  eyebrow: string;
  title: string;
  description: string;
  tip: string;
};

const GUIDE_VERSION = 'v1';
const steps: GuideStep[] = [
  {
    eyebrow: '1 / 3 · 일정 관리',
    title: '먼저 오늘 할 일을 적어보세요',
    description: '월간·오늘·주간 화면에서 일정을 확인하고 시간 블록 단위로 계획할 수 있어요.',
    tip: '오늘 탭에서 작은 일정 하나를 만드는 것부터 시작해 보세요.'
  },
  {
    eyebrow: '2 / 3 · AI 작업 분해',
    title: '막막한 목표를 작은 단계로 나눠요',
    description: '생산성 탭에서 목표와 사용할 수 있는 총 시간을 분 단위로 입력하면 AI가 바로 실행할 단계로 나눠줘요.',
    tip: '숫자 60은 각 단계의 시간이 아니라 전체 작업에 사용할 수 있는 60분을 의미해요.'
  },
  {
    eyebrow: '3 / 3 · 집중과 회고',
    title: '실행하고 기록하며 개선해요',
    description: '포커스 모드로 집중 시간을 기록하고, 하루 회고에서 오늘의 흐름을 돌아볼 수 있어요.',
    tip: '가이드는 설정 탭에서 언제든 다시 볼 수 있어요.'
  }
];

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const storageKey = `antiadhd.onboarding.${GUIDE_VERSION}.${userId}`;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((completed) => {
      if (active && completed !== 'completed') {
        setStepIndex(0);
        setIsVisible(true);
      }
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const openGuide = useCallback(() => {
    setStepIndex(0);
    setIsVisible(true);
  }, []);

  const closeGuide = useCallback(async () => {
    await AsyncStorage.setItem(storageKey, 'completed');
    setIsVisible(false);
  }, [storageKey]);

  const value = useMemo(() => ({ openGuide }), [openGuide]);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeGuide}>
        <View style={styles.backdrop}>
          <View style={styles.card} accessibilityViewIsModal>
            <Text style={styles.eyebrow}>{step.eyebrow}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipLabel}>TIP</Text>
              <Text style={styles.tip}>{step.tip}</Text>
            </View>
            <View style={styles.dots}>
              {steps.map((_, index) => (
                <View key={index} style={[styles.dot, index === stepIndex && styles.activeDot]} />
              ))}
            </View>
            <View style={styles.actions}>
              {stepIndex > 0 ? (
                <Button title="이전" variant="secondary" onPress={() => setStepIndex(stepIndex - 1)} />
              ) : (
                <Button title="건너뛰기" variant="secondary" onPress={closeGuide} />
              )}
              <Button
                title={isLastStep ? '시작하기' : '다음'}
                onPress={isLastStep ? closeGuide : () => setStepIndex(stepIndex + 1)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider.');
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.58)'
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    padding: 22,
    backgroundColor: colors.surface,
    gap: 12
  },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  title: { color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  tipBox: { borderRadius: 12, padding: 14, backgroundColor: colors.surfaceMuted, gap: 5 },
  tipLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  tip: { color: colors.text, lineHeight: 21, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  activeDot: { width: 22, backgroundColor: colors.primary },
  actions: { gap: 8 }
});
