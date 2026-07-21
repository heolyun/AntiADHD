const base = require('./app.json');

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = () => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || base.expo.extra.apiBaseUrl;

  return {
    ...base.expo,
    version: process.env.APP_VERSION || base.expo.version,
    android: {
      ...base.expo.android,
      versionCode: positiveInteger(process.env.APP_VERSION_CODE, base.expo.android.versionCode)
    },
    extra: {
      ...base.expo.extra,
      apiBaseUrl
    }
  };
};
