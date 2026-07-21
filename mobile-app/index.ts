import Constants from 'expo-constants';
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

registerRootComponent(App);

// Expo Go does not include the native widget module. A development or release
// build registers the headless widget task when Android launches it.
if (Platform.OS === 'android' && Constants.appOwnership !== 'expo') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/features/widget/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
