import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncPendingScheduleMutations } from './scheduleOfflineStore';

export function ScheduleSyncManager() {
  useEffect(() => {
    const unsubscribeNetwork = NetInfo.addEventListener((network) => {
      if (network.isConnected && network.isInternetReachable !== false) {
        void syncPendingScheduleMutations();
      }
    });
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void syncPendingScheduleMutations();
    });
    void syncPendingScheduleMutations();

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}
