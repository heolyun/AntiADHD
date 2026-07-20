import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';
import type { RootTabParamList } from '../../../types/navigation';

type OnboardingContextValue = {
  openGuide: () => void;
};

type GuideStep = {
  route: keyof RootTabParamList;
  eyebrow: string;
  title: string;
  description: string;
  tip: string;
  tabIndex: number;
};

const GUIDE_VERSION = 'v2';
const steps: GuideStep[] = [
  {
    route: 'MonthlyCalendar',
    eyebrow: '1 / 5 · 월간',
    title: '한 달의 시간 블록을 한눈에 봐요',
    description: '날짜를 누르면 그날의 일정이 아래에 표시돼요. 선택한 날짜에 바로 일정을 추가할 수도 있어요.',
    tip: '아래 화살표가 가리키는 월간 탭이 전체 계획의 시작점이에요.',
    tabIndex: 0
  },
  {
    route: 'Home',
    eyebrow: '2 / 5 · 오늘',
    title: '오늘 실행할 일에만 집중해요',
    description: '오늘 일정과 완료 개수를 확인하고, 오른쪽 아래 + 버튼으로 새 시간 블록을 만들 수 있어요.',
    tip: '일정을 완료하면 체크해서 오늘의 진행 상황을 기록해 보세요.',
    tabIndex: 1
  },
  {
    route: 'WeeklySchedule',
    eyebrow: '3 / 5 · 주간',
    title: '이번 주의 흐름을 조정해요',
    description: '요일별 일정 밀도를 비교하면서 일이 한쪽에 몰리지 않았는지 확인하는 화면이에요.',
    tip: '계획이 과하면 다른 날짜로 옮겨 현실적인 한 주를 만들어 보세요.',
    tabIndex: 2
  },
  {
    route: 'Productivity',
    eyebrow: '4 / 5 · 생산성',
    title: 'AI와 집중 도구를 여기서 사용해요',
    description: 'AI 작업 분해, 포커스 모드, 목표·루틴·하루 회고 같은 핵심 생산성 기능이 모여 있어요.',
    tip: 'AI 작업 분해의 숫자 60은 각 단계가 아니라 전체 작업에 사용할 수 있는 총 60분이에요.',
    tabIndex: 3
  },
  {
    route: 'Settings',
    eyebrow: '5 / 5 · 설정',
    title: '계정과 연결 상태를 확인해요',
    description: '현재 로그인 계정과 연결된 API 서버를 확인할 수 있어요.',
    tip: '이 가이드는 설정의 ‘사용 가이드 다시 보기’에서 언제든 다시 시작할 수 있어요.',
    tabIndex: 4
  }
];

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  userId,
  navigateToTab,
  children
}: {
  userId: number;
  navigateToTab: (route: keyof RootTabParamList) => void;
  children: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const storageKey = `antiadhd.onboarding.${GUIDE_VERSION}.${userId}`;

  const showStep = useCallback((index: number) => {
    setStepIndex(index);
    navigateToTab(steps[index].route);
  }, [navigateToTab]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((completed) => {
      if (active && completed !== 'completed') {
        showStep(0);
        setIsVisible(true);
      }
    });
    return () => {
      active = false;
    };
  }, [showStep, storageKey]);

  const openGuide = useCallback(() => {
    showStep(0);
    setIsVisible(true);
  }, [showStep]);

  const closeGuide = useCallback(async () => {
    await AsyncStorage.setItem(storageKey, 'completed');
    setIsVisible(false);
  }, [storageKey]);

  const value = useMemo(() => ({ openGuide }), [openGuide]);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const pointerLeft = `${step.tabIndex * 20 + 10}%` as `${number}%`;

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeGuide}>
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.card} accessibilityViewIsModal>
            <Text style={styles.eyebrow}>{step.eyebrow}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipLabel}>이 화면의 핵심</Text>
              <Text style={styles.tip}>{step.tip}</Text>
            </View>
            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <Button
                  title={stepIndex === 0 ? '건너뛰기' : '이전'}
                  variant="secondary"
                  onPress={stepIndex === 0 ? closeGuide : () => showStep(stepIndex - 1)}
                />
              </View>
              <View style={styles.actionButton}>
                <Button
                  title={isLastStep ? '시작하기' : '다음'}
                  onPress={isLastStep ? closeGuide : () => showStep(stepIndex + 1)}
                />
              </View>
            </View>
          </View>
          <View style={[styles.pointer, { left: pointerLeft }]}>
            <Text style={styles.arrow}>↓</Text>
            <View style={styles.targetRing} />
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
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.22)' },
  card: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 520,
    marginBottom: 112,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.surface,
    gap: 11,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  title: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  tipBox: { borderRadius: 12, padding: 13, backgroundColor: colors.surfaceMuted, gap: 5 },
  tipLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  tip: { color: colors.text, lineHeight: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 3 },
  actionButton: { flex: 1 },
  pointer: {
    position: 'absolute',
    bottom: 12,
    width: 72,
    marginLeft: -36,
    alignItems: 'center'
  },
  arrow: { color: colors.primary, fontSize: 38, lineHeight: 40, fontWeight: '900' },
  targetRing: {
    width: 66,
    height: 48,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.12)'
  }
});
