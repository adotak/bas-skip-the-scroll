import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { AndroidGate } from '@/modules/android-gate';

interface TargetAppOption {
  id: string;
  name: string;
  packageName: string;
}

const DEFAULT_TARGET_APPS: TargetAppOption[] = [
  { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android' },
  { id: 'tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { id: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube' },
  { id: 'facebook', name: 'Facebook', packageName: 'com.facebook.katana' },
  { id: 'snapchat', name: 'Snapchat', packageName: 'com.snapchat.android' },
  { id: 'twitter', name: 'X / Twitter', packageName: 'com.twitter.android' },
];

const PAUSE_OPTIONS = [3, 5, 10, 15];

export default function SettingsScreen() {
  const [isGateEnabled, setIsGateEnabled] = useState(true);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [pauseSeconds, setPauseSeconds] = useState(5);

  const [hasUsageAccess, setHasUsageAccess] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [hasBatteryExemption, setHasBatteryExemption] = useState(false);

  useEffect(() => {
    refreshPermissions();
    setSelectedApps(AndroidGate.getTargetApps());
    setPauseSeconds(AndroidGate.getPauseDuration());
    setIsGateEnabled(AndroidGate.getGateStats().isEnabled);
  }, []);

  const refreshPermissions = () => {
    setHasUsageAccess(AndroidGate.hasUsageStatsPermission());
    setHasOverlay(AndroidGate.hasOverlayPermission());
    setHasBatteryExemption(AndroidGate.isIgnoringBatteryOptimizations());
  };

  const handleToggleGate = (enabled: boolean) => {
    setIsGateEnabled(enabled);
    if (enabled) {
      AndroidGate.startDetectorService();
    } else {
      AndroidGate.stopDetectorService();
    }
  };

  const toggleApp = (packageName: string) => {
    let next: string[];
    if (selectedApps.includes(packageName)) {
      next = selectedApps.filter((p) => p !== packageName);
    } else {
      next = [...selectedApps, packageName];
    }
    setSelectedApps(next);
    AndroidGate.setTargetApps(next);
  };

  const handleSetPause = (seconds: number) => {
    setPauseSeconds(seconds);
    AndroidGate.setPauseDuration(seconds);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Gate Settings</Text>
        </View>

        {/* Master Toggle */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Pause Gate</Text>
              <Text style={styles.cardSubtitle}>
                Pause before target feed apps open to verify your intent.
              </Text>
            </View>
            <Switch
              value={isGateEnabled}
              onValueChange={handleToggleGate}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor={Colors.text}
            />
          </View>
        </View>

        {/* Permissions Onboarding / Status */}
        <Text style={styles.sectionTitle}>Android Permissions</Text>
        <View style={styles.card}>
          {/* Permission 1: Usage Access */}
          <View style={styles.permissionItem}>
            <View style={styles.flex}>
              <Text style={styles.permissionName}>Usage Access</Text>
              <Text style={styles.permissionDescription}>
                Detects when a feed app opens. We never read what is inside other apps.
              </Text>
            </View>
            <Pressable
              style={[
                styles.permButton,
                hasUsageAccess && styles.permButtonGranted,
              ]}
              onPress={() => {
                AndroidGate.openUsageStatsSettings();
                setTimeout(refreshPermissions, 1000);
              }}
            >
              <Text style={styles.permButtonText}>
                {hasUsageAccess ? 'Granted ✓' : 'Grant'}
              </Text>
            </Pressable>
          </View>

          {/* Permission 2: Display Over Other Apps */}
          <View style={styles.permissionItem}>
            <View style={styles.flex}>
              <Text style={styles.permissionName}>Display over other apps</Text>
              <Text style={styles.permissionDescription}>
                Displays the full-screen breathing pause over the app.
              </Text>
            </View>
            <Pressable
              style={[
                styles.permButton,
                hasOverlay && styles.permButtonGranted,
              ]}
              onPress={() => {
                AndroidGate.openOverlaySettings();
                setTimeout(refreshPermissions, 1000);
              }}
            >
              <Text style={styles.permButtonText}>
                {hasOverlay ? 'Granted ✓' : 'Grant'}
              </Text>
            </Pressable>
          </View>

          {/* Permission 3: Samsung Battery Exemption */}
          <View style={styles.permissionItem}>
            <View style={styles.flex}>
              <Text style={styles.permissionName}>Battery Optimization Exemption</Text>
              <Text style={styles.permissionDescription}>
                Crucial for Samsung & OnePlus to prevent Android from silently killing the service.
              </Text>
            </View>
            <Pressable
              style={[
                styles.permButton,
                hasBatteryExemption && styles.permButtonGranted,
              ]}
              onPress={() => {
                AndroidGate.openBatteryOptimizationSettings();
                setTimeout(refreshPermissions, 1000);
              }}
            >
              <Text style={styles.permButtonText}>
                {hasBatteryExemption ? 'Granted ✓' : 'Grant'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Breathing Pause Duration */}
        <Text style={styles.sectionTitle}>Breathing Pause Length</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>
            How many seconds to pause and breathe before showing choices:
          </Text>
          <View style={styles.chipsRow}>
            {PAUSE_OPTIONS.map((sec) => (
              <Pressable
                key={sec}
                style={[
                  styles.pauseChip,
                  pauseSeconds === sec && styles.pauseChipActive,
                ]}
                onPress={() => handleSetPause(sec)}
              >
                <Text
                  style={[
                    styles.pauseChipText,
                    pauseSeconds === sec && styles.pauseChipTextActive,
                  ]}
                >
                  {sec}s
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Target Apps */}
        <Text style={styles.sectionTitle}>Target Apps to Pause</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>
            Messaging apps (WhatsApp, Messenger) are excluded by default.
          </Text>
          {DEFAULT_TARGET_APPS.map((app) => {
            const isSelected = selectedApps.includes(app.packageName);
            return (
              <View key={app.id} style={styles.appRow}>
                <Text style={styles.appName}>{app.name}</Text>
                <Switch
                  value={isSelected}
                  onValueChange={() => toggleApp(app.packageName)}
                  trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
                  thumbColor={Colors.text}
                />
              </View>
            );
          })}
        </View>

        {/* Test Gate Button */}
        <Pressable
          style={styles.previewBtn}
          onPress={() => router.push('/gate')}
        >
          <Text style={styles.previewBtnText}>▶  Preview Gate Screen</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backBtnText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  permissionName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.3,
  },
  permButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  permButtonGranted: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  permButtonText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  pauseChip: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  pauseChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  pauseChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  pauseChipTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  appName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  previewBtn: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  previewBtnText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
