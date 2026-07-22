import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { reportClientError } from '../observability/clientErrorReporter';
import { Button } from './Button';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportClientError(
      new Error(`${error.message} | ${info.componentStack?.slice(0, 250) ?? ''}`),
      'render_boundary'
    );
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>화면을 표시하지 못했어요</Text>
        <Text style={styles.body}>오류 정보는 개인정보를 제외하고 기록했습니다. 다시 시도해주세요.</Text>
        <Button title="다시 시도" onPress={() => this.setState({ failed: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 14, padding: 24, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 21 }
});
