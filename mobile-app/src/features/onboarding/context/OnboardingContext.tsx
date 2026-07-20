import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/theme';
import type { RootTabParamList } from '../../../types/navigation';

type TargetRect = { x: number; y: number; width: number; height: number };

type OnboardingContextValue = {
  activeTargetId: string | null;
  openGuide: () => void;
  registerTarget: (id: string, ref: RefObject<View | null>) => () => void;
  measureTarget: (id: string) => void;
};

type GuideStep = {
  route: keyof RootTabParamList;
  targetId: string;
  eyebrow: string;
  title: string;
  description: string;
};

const GUIDE_VERSION = 'v3';
const steps: GuideStep[] = [
  {
    route: 'MonthlyCalendar',
    targetId: 'monthly-add',
    eyebrow: '1 / 6 · 월간',
    title: '선택한 날짜에 일정을 추가해요',
    description: '달력에서 날짜를 고른 뒤 강조된 영역의 추가 버튼으로 시간 블록을 만들 수 있어요.'
  },
  {
    route: 'Home',
    targetId: 'today-add',
    eyebrow: '2 / 6 · 오늘',
    title: '오늘 할 일을 빠르게 추가해요',
    description: '오른쪽 아래 + 버튼은 어디서든 바로 오늘 일정을 만드는 가장 빠른 방법이에요.'
  },
  {
    route: 'WeeklySchedule',
    targetId: 'weekly-days',
    eyebrow: '3 / 6 · 주간',
    title: '이번 주의 일정 밀도를 비교해요',
    description: '요일별 시간 블록을 살펴보고 일이 한쪽에 몰렸다면 현실적으로 다시 배치해 보세요.'
  },
  {
    route: 'Productivity',
    targetId: 'productivity-actions',
    eyebrow: '4 / 6 · 생산성 도구',
    title: '집중·목표·루틴·회고를 관리해요',
    description: '강조된 바로 실행 영역에서 포커스 모드와 주요 생산성 기능으로 이동할 수 있어요.'
  },
  {
    route: 'Productivity',
    targetId: 'productivity-ai',
    eyebrow: '5 / 6 · AI 작업 분해',
    title: '막막한 목표를 실행 단계로 나눠요',
    description: '목표와 전체 사용 가능 시간을 입력하면 AI가 그 시간 안에 실행할 작은 단계로 나눠줘요.'
  },
  {
    route: 'Settings',
    targetId: 'settings-guide',
    eyebrow: '6 / 6 · 다시 보기',
    title: '필요할 때 가이드를 다시 열어요',
    description: '설정의 사용 가이드 다시 보기 버튼을 누르면 이 안내를 언제든 처음부터 볼 수 있어요.'
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const targets = useRef(new Map<string, RefObject<View | null>>());
  const requestedTargetId = useRef<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const storageKey = `antiadhd.onboarding.${GUIDE_VERSION}.${userId}`;
  const activeTargetId = isVisible ? steps[stepIndex].targetId : null;

  const measureTarget = useCallback((id: string) => {
    if (requestedTargetId.current !== id) return;
    const target = targets.current.get(id)?.current;
    if (!target) return;
    target.measureInWindow((x, y, width, height) => {
      if (requestedTargetId.current !== id) return;
      const isVisibleOnScreen = width > 0
        && height > 0
        && x >= 0
        && y >= 0
        && x + width <= windowWidth
        && y + height <= windowHeight;
      if (isVisibleOnScreen) setTargetRect({ x, y, width, height });
    });
  }, [windowHeight, windowWidth]);

  const registerTarget = useCallback((id: string, ref: RefObject<View | null>) => {
    targets.current.set(id, ref);
    return () => {
      targets.current.delete(id);
    };
  }, []);

  const showStep = useCallback((index: number) => {
    requestedTargetId.current = steps[index].targetId;
    setTargetRect(null);
    setStepIndex(index);
    navigateToTab(steps[index].route);
    [120, 350, 700].forEach((delay) => {
      setTimeout(() => measureTarget(steps[index].targetId), delay);
    });
  }, [measureTarget, navigateToTab]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((completed) => {
      if (active && completed !== 'completed') {
        setIsVisible(true);
        showStep(0);
      }
    });
    return () => { active = false; };
  }, [showStep, storageKey]);

  const openGuide = useCallback(() => {
    setIsVisible(true);
    showStep(0);
  }, [showStep]);

  const closeGuide = useCallback(async () => {
    await AsyncStorage.setItem(storageKey, 'completed');
    requestedTargetId.current = null;
    setIsVisible(false);
    setTargetRect(null);
  }, [storageKey]);

  const value = useMemo(() => ({ activeTargetId, openGuide, registerTarget, measureTarget }), [
    activeTargetId,
    measureTarget,
    openGuide,
    registerTarget
  ]);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const spotlight = targetRect ? (() => {
    const x = Math.max(8, targetRect.x - 6);
    const y = Math.max(8, targetRect.y - 6);
    return {
      x,
      y,
      width: Math.max(1, Math.min(windowWidth - x - 8, targetRect.width + 12)),
      height: Math.max(1, Math.min(windowHeight - y - 8, targetRect.height + 12))
    };
  })() : null;
  const cardBelowTarget = Boolean(spotlight && spotlight.y + spotlight.height < windowHeight * 0.48);
  const cardPosition = spotlight
    ? cardBelowTarget
      ? { top: Math.max(18, Math.min(spotlight.y + spotlight.height + 28, windowHeight - 300)) }
      : { bottom: Math.max(18, Math.min(windowHeight - spotlight.y + 28, windowHeight - 120)) }
    : { top: Math.max(30, windowHeight * 0.24) };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeGuide}>
        <View style={styles.overlay}>
          {spotlight ? (
            <>
              <View style={[styles.dim, { left: 0, top: 0, right: 0, height: spotlight.y }]} />
              <View style={[styles.dim, { left: 0, top: spotlight.y, width: spotlight.x, height: spotlight.height }]} />
              <View style={[styles.dim, { left: spotlight.x + spotlight.width, right: 0, top: spotlight.y, height: spotlight.height }]} />
              <View style={[styles.dim, { left: 0, right: 0, top: spotlight.y + spotlight.height, bottom: 0 }]} />
              <View style={[styles.spotlight, spotlight]} />
              <Text style={[
                styles.arrow,
                cardBelowTarget
                  ? { left: spotlight.x + spotlight.width / 2 - 15, top: spotlight.y + spotlight.height - 2 }
                  : { left: spotlight.x + spotlight.width / 2 - 15, top: spotlight.y - 42 }
              ]}>
                {cardBelowTarget ? '↓' : '↑'}
              </Text>
            </>
          ) : <View style={[styles.dim, StyleSheet.absoluteFillObject]} />}

          <View style={[styles.card, cardPosition]}>
            <Text style={styles.eyebrow}>{step.eyebrow}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            {!spotlight ? <Text style={styles.locating}>안내할 기능의 위치를 찾는 중...</Text> : null}
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
        </View>
      </Modal>
    </OnboardingContext.Provider>
  );
}

export function GuideTarget({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { registerTarget, measureTarget } = useOnboarding();
  const ref = useRef<View>(null);

  useEffect(() => registerTarget(id, ref), [id, registerTarget]);

  return (
    <View ref={ref} collapsable={false} onLayout={() => measureTarget(id)} style={style}>
      {children}
    </View>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider.');
  return context;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  dim: { position: 'absolute', backgroundColor: 'rgba(15, 23, 42, 0.58)' },
  spotlight: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)'
  },
  arrow: { position: 'absolute', color: colors.primary, fontSize: 34, lineHeight: 38, fontWeight: '900' },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 520,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.surface,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9
  },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  title: { color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  locating: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1 }
});
