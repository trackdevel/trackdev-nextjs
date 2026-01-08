# TrackDev Mobile App

React Native mobile application for TrackDev, built with Expo.

## Features

- 📱 Cross-platform (iOS & Android)
- 🎨 NativeWind (Tailwind CSS) styling
- 🔐 Secure authentication with JWT
- 📂 File-based routing with Expo Router
- 🔄 Shared API client with web app

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Expo Go app on your phone (for testing)
- iOS Simulator (macOS) or Android Emulator

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Build shared packages first
pnpm build:packages
```

### Development

```bash
# Start Expo development server
pnpm dev:mobile

# Or from this directory
pnpm start
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

### Running on Simulators

```bash
# iOS Simulator (macOS only)
pnpm ios

# Android Emulator
pnpm android
```

## Project Structure

```
apps/mobile/
├── app/                  # Expo Router pages
│   ├── (tabs)/          # Tab navigation screens
│   │   ├── index.tsx    # Dashboard tab
│   │   ├── projects.tsx # Projects tab
│   │   └── profile.tsx  # Profile tab
│   ├── login.tsx        # Login screen
│   ├── register.tsx     # Registration screen
│   └── _layout.tsx      # Root layout
├── assets/              # App icons and images
├── app.json             # Expo configuration
├── babel.config.js      # Babel config for NativeWind
├── metro.config.js      # Metro bundler config
├── tailwind.config.js   # Tailwind CSS config
└── package.json
```

## Configuration

### Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Configure:
- `EXPO_PUBLIC_API_URL`: Your Spring Boot API URL

### NativeWind (Tailwind CSS)

The app uses NativeWind v4 for styling. Tailwind classes work just like on web:

```tsx
<View className="flex-1 items-center justify-center bg-primary-500">
  <Text className="text-xl font-bold text-white">Hello!</Text>
</View>
```

## Building for Production

### Using EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Local Build (Advanced)

```bash
# Generate native projects
npx expo prebuild

# Build iOS (macOS only)
cd ios && pod install && cd ..
npx react-native run-ios --configuration Release

# Build Android
cd android && ./gradlew assembleRelease
```

## Troubleshooting

### Metro bundler issues

```bash
# Clear cache and restart
npx expo start -c
```

### NativeWind styles not applying

1. Ensure `global.css` is imported in `_layout.tsx`
2. Check `babel.config.js` includes NativeWind preset
3. Restart Metro with cache clear

### Can't connect to API

1. Check `EXPO_PUBLIC_API_URL` in `.env`
2. Ensure API is running and accessible
3. For local development, use your machine's IP (not `localhost`)

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native](https://reactnative.dev/)
