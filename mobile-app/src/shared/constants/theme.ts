export const colors = {
  background: '#f5f7fb',
  surface: '#ffffff',
  surfaceMuted: '#eef2f7',
  text: '#18202f',
  muted: '#64748b',
  border: '#d8dee9',
  primary: '#2563eb',
  success: '#059669',
  danger: '#dc2626',
  warning: '#d97706',
  violet: '#7c3aed',
  cyan: '#0891b2'
};

export const scheduleColors = [
  colors.primary,
  colors.success,
  colors.danger,
  colors.warning,
  colors.violet,
  colors.cyan
];

export const repeatLabels = {
  NONE: '반복 없음',
  DAILY: '매일',
  WEEKLY: '매주',
  MONTHLY: '매월'
} as const;
