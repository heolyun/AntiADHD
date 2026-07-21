const { withAppBuildGradle } = require('@expo/config-plugins');

const signingConfig = `
        release {
            def keystorePath = System.getenv("ANDROID_KEYSTORE_FILE")
            if (keystorePath) {
                storeFile file(keystorePath)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') return mod;

    let source = mod.modResults.contents;
    if (!source.includes('def hasReleaseSigning')) {
      source = source.replace(
        'android {',
        `def hasReleaseSigning = [\n    "ANDROID_KEYSTORE_FILE",\n    "ANDROID_KEYSTORE_PASSWORD",\n    "ANDROID_KEY_ALIAS",\n    "ANDROID_KEY_PASSWORD"\n].every { System.getenv(it) }\n\nandroid {`
      );
    }
    if (!source.includes('release {\n            def keystorePath')) {
      source = source.replace(/(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s*}\s*)\n\s*}/, `$1${signingConfig}\n    }`);
    }
    source = source.replace(
      'signingConfig signingConfigs.debug\n            shrinkResources',
      'signingConfig hasReleaseSigning ? signingConfigs.release : signingConfigs.debug\n            shrinkResources'
    );
    mod.modResults.contents = source;
    return mod;
  });
}

module.exports = withAndroidReleaseSigning;
