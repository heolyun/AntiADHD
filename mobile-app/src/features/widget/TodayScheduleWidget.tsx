import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { TodayWidgetData } from './widgetStorage';

export function TodayScheduleWidget({ data }: { data: TodayWidgetData }) {
  const completed = data.items.filter((item) => item.completed).length;
  const upcoming = data.items.filter((item) => !item.completed).slice(0, 3);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'atiadhd://today' }}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 14,
        flexGap: 8
      }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="오늘 일정" style={{ color: '#172033', fontSize: 17, fontWeight: '800' }} />
          <TextWidget text={`${completed}/${data.items.length} 완료`} style={{ color: '#6b7280', fontSize: 11 }} />
        </FlexWidget>
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'atiadhd://schedule/new' }}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#2f6fed', alignItems: 'center', justifyContent: 'center' }}
        >
          <TextWidget text="+" style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }} />
        </FlexWidget>
      </FlexWidget>

      {upcoming.length === 0 ? (
        <TextWidget text={data.items.length === 0 ? '오늘 등록된 일정이 없어요' : '오늘 일정을 모두 완료했어요'} style={{ color: '#6b7280', fontSize: 13 }} />
      ) : upcoming.map((item) => (
        <FlexWidget key={item.id} style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', flexGap: 8 }}>
          <TextWidget text={item.startAt.slice(11, 16)} style={{ color: '#2f6fed', fontSize: 12, fontWeight: '700' }} />
          <TextWidget text={item.title} maxLines={1} truncate="END" style={{ color: '#172033', fontSize: 13 }} />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
