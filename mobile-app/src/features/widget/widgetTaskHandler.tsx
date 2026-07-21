import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TodayScheduleWidget } from './TodayScheduleWidget';
import { loadTodayWidgetData } from './widgetStorage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== 'TodaySchedule') return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(<TodayScheduleWidget data={await loadTodayWidgetData()} />);
      break;
    default:
      break;
  }
}
