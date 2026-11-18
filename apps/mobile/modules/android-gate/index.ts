import { Platform } from 'react-native';

export interface GateStats {
  gateShown: number;
  redirects: number;
  continueAnyway: number;
  basePauseDuration: number;
  targetAppsCount: number;
  isEnabled: boolean;
}

interface NativeAndroidGateModule {
  isSupported(): boolean;
  hasUsageStatsPermission(): boolean;
  openUsageStatsSettings(): void;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatteryOptimizationSettings(): void;
  startDetectorService(): boolean;
  stopDetectorService(): boolean;
  isDetectorServiceRunning(): boolean;
  setTargetApps(apps: string[]): void;
  getTargetApps(): string[];
  setPauseDuration(seconds: number): void;
  getPauseDuration(): number;
  getGateStats(): GateStats;
}

let nativeModule: NativeAndroidGateModule | null = null;
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoCore = require('expo-modules-core');
    if (typeof expoCore.requireNativeModule === 'function') {
      nativeModule = expoCore.requireNativeModule('AndroidGate');
    }
  } catch {
    nativeModule = null;
  }
}

export const AndroidGate = {
  isSupported(): boolean {
    return nativeModule?.isSupported() ?? false;
  },
  hasUsageStatsPermission(): boolean {
    return nativeModule?.hasUsageStatsPermission() ?? false;
  },
  openUsageStatsSettings(): void {
    nativeModule?.openUsageStatsSettings();
  },
  hasOverlayPermission(): boolean {
    return nativeModule?.hasOverlayPermission() ?? false;
  },
  openOverlaySettings(): void {
    nativeModule?.openOverlaySettings();
  },
  isIgnoringBatteryOptimizations(): boolean {
    return nativeModule?.isIgnoringBatteryOptimizations() ?? true;
  },
  openBatteryOptimizationSettings(): void {
    nativeModule?.openBatteryOptimizationSettings();
  },
  startDetectorService(): boolean {
    return nativeModule?.startDetectorService() ?? false;
  },
  stopDetectorService(): boolean {
    return nativeModule?.stopDetectorService() ?? false;
  },
  isDetectorServiceRunning(): boolean {
    return nativeModule?.isDetectorServiceRunning() ?? false;
  },
  setTargetApps(apps: string[]): void {
    nativeModule?.setTargetApps(apps);
  },
  getTargetApps(): string[] {
    return nativeModule?.getTargetApps() ?? [
      'com.instagram.android',
      'com.zhiliaoapp.musically',
      'com.google.android.youtube',
      'com.facebook.katana',
      'com.snapchat.android',
      'com.twitter.android',
    ];
  },
  setPauseDuration(seconds: number): void {
    nativeModule?.setPauseDuration(seconds);
  },
  getPauseDuration(): number {
    return nativeModule?.getPauseDuration() ?? 5;
  },
  getGateStats(): GateStats {
    return nativeModule?.getGateStats() ?? {
      gateShown: 0,
      redirects: 0,
      continueAnyway: 0,
      basePauseDuration: 5,
      targetAppsCount: 6,
      isEnabled: false,
    };
  },
};
