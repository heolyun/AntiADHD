# AtiADHD Android 앱 및 위젯 개발 환경

## 앱 식별자

- 표시 이름: `AtiADHD`
- Android application ID: `com.heolyun.atiadhd`
- iOS bundle identifier: `com.heolyun.atiadhd`
- 딥링크 scheme: `atiadhd://`

## Windows 준비

1. Android Studio를 설치한다.
2. 설치 관리자에서 Android SDK, Android SDK Platform, Android Virtual Device,
   Android SDK Platform-Tools와 Android SDK Build-Tools를 선택한다.
3. Android Studio의 SDK Manager에서 프로젝트가 요구하는 SDK를 설치한다.
4. 터미널을 새로 열고 아래 항목을 확인한다.

```powershell
java -version
adb version
$env:ANDROID_HOME
```

일반적인 SDK 경로는 `%LOCALAPPDATA%\Android\Sdk`다. Android Studio에 포함된 JDK를
사용하는 경우 `JAVA_HOME`은 Android Studio의 `jbr` 디렉터리를 가리키도록 설정한다.

## 실제 휴대폰 준비

1. Android 설정에서 개발자 옵션을 활성화한다.
2. USB 디버깅을 활성화한다.
3. USB로 PC에 연결하고 휴대폰에 표시되는 디버깅 허용 창을 승인한다.
4. `adb devices`에서 상태가 `device`인지 확인한다.

## 빌드

```powershell
cd C:\Project\AntiADHD\mobile-app
npm install
npm run prebuild:android
npm run native:android
```

네이티브 프로젝트는 Expo Config Plugin에서 재생성되므로 `android/`를 직접 수정하지 않는다.
디버그 APK만 만들려면 `npm run build:android:debug`을 실행한다.

## 위젯 확인

앱을 한 번 실행하고 로그인하여 오늘 일정을 동기화한 뒤, 홈 화면을 길게 눌러
`위젯 > AtiADHD > AtiADHD 오늘 일정`을 추가한다. 위젯은 최대 세 개의 다음 일정과
완료 현황을 표시하며 30분 주기 또는 앱의 일정 동기화 직후 갱신된다.

현재 온프레미스 API는 HTTP와 사설 IP를 사용하므로 집 네트워크에서 먼저 테스트한다.
외부 사용 전에 HTTPS와 안전한 외부 접속 방식을 구성하고 `usesCleartextTraffic`을 제거한다.
