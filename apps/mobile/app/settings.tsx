import React, { useState, useEffect, useCallback } from 'react';
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
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  type Language,
} from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { FloatingMenuDock } from '@/components/FloatingMenuDock';
import { AndroidGate } from '@/modules/android-gate';
import { getPreferredLanguage, setPreferredLanguage } from '@/store/storage';

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
  const [preferredLang, setPreferredLangState] = useState<Language>('en');

  const [hasUsageAccess, setHasUsageAccess] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [hasBatteryExemption, setHasBatteryExemption] = useState(false);

  const refreshPermissions = useCallback(() => {
    setHasUsageAccess(AndroidGate.hasUsageStatsPermission());
    setHasOverlay(AndroidGate.hasOverlayPermission());
    setHasBatteryExemption(AndroidGate.isIgnoringBatteryOptimizations());
  }, []);

  useEffect(() => {
    refreshPermissions();
    setSelectedApps(AndroidGate.getTargetApps());
    setPauseSeconds(AndroidGate.getPauseDuration());
    setIsGateEnabled(AndroidGate.getGateStats().isEnabled);
    getPreferredLanguage().then(setPreferredLangState);
  }, [refreshPermissions]);

  const handleToggleGate = (enabled: boolean) => {
    if (enabled) {
      const started = AndroidGate.startDetectorService();
      if (!started) {
        setIsGateEnabled(false);
        Alert.alert(
          'Permissions required',
          'Grant Usage Access and Display over other apps before enabling the Pause Gate.',
        );
        refreshPermissions();
        return;
      }
      setIsGateEnabled(true);
    } else {
      AndroidGate.stopDetectorService();
      setIsGateEnabled(false);
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

  const handleSelectLanguage = async (lang: Language) => {
    setPreferredLangState(lang);
    await setPreferredLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Editorial Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>W.CONFIGURATION</Text>
            <Text style={styles.title}>Gate Settings</Text>
          </View>
        </View>

        {/* Master Toggle (.card-directory-sp dark card) */}
        <View style={styles.darkCard}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>
                  {isGateEnabled ? 'ACTIVE PROTECTION' : 'PAUSED'}
                </Text>
              </View>
              <Text style={styles.darkCardTitle}>Pause Gate</Text>
              <Text style={styles.darkCardSubtitle}>
                Pause before target feed apps open to verify your intent.
              </Text>
            </View>
            <Switch
              value={isGateEnabled}
              onValueChange={handleToggleGate}
              trackColor={{ false: Colors.surfaceDarkBorder, true: Colors.mint }}
              thumbColor={Colors.textInverse}
            />
          </View>
        </View>

        {/* Default Language Preference */}
        <Text style={styles.sectionTitle}>Default Summary Language</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>
            Choose your default TL;DR summary language (Roman Urdu & Urdu queries are also auto-detected):
          </Text>
          <View style={styles.chipsContainer}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l}
                style={[
                  styles.pauseChip,
                  preferredLang === l && styles.pauseChipActive,
                ]}
                onPress={() => handleSelectLanguage(l)}
              >
                <Text
                  style={[
                    styles.pauseChipText,
                    preferredLang === l && styles.pauseChipTextActive,
                  ]}
                >
                  {LANGUAGE_LABELS[l]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Permissions Onboarding / Status (.tb-dotteds) */}
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
              <Text
                style={[
                  styles.permButtonText,
                  hasUsageAccess && styles.permButtonTextGranted,
                ]}
              >
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
              <Text
                style={[
                  styles.permButtonText,
                  hasOverlay && styles.permButtonTextGranted,
                ]}
              >
                {hasOverlay ? 'Granted ✓' : 'Grant'}
              </Text>
            </Pressable>
          </View>

          {/* Permission 3: Samsung Battery Exemption */}
          <View style={[styles.permissionItem, { borderBottomWidth: 0 }]}>
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
              <Text
                style={[
                  styles.permButtonText,
                  hasBatteryExemption && styles.permButtonTextGranted,
                ]}
              >
                {hasBatteryExemption ? 'Granted ✓' : 'Grant'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Breathing Pause Duration */}
        <Text style={styles.sectionTitle}>Breathing Pause Length</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>
            How many seconds to pause and breathe before showing choices (escalates 5s → 10s → 15s on repeated opens):
          </Text>
          <View style={styles.chipsContainer}>
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
                  trackColor={{ false: Colors.surfaceLight, true: Colors.surfaceDark }}
                  thumbColor={Colors.textInverse}
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

      <FloatingMenuDock
        activeTab="settings"
        ctaLabel="Preview Gate"
        onCtaPress={() => router.push('/gate')}
      />
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
    paddingBottom: 110,
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
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  darkCard: {
    backgroundColor: Colors.surfaceDark, // #222222
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statusTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lemon,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginBottom: 6,
  },
  statusTagText: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  darkCardTitle: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: 4,
  },
  darkCardSubtitle: {
    color: '#A7A7A7',
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: Colors.border,
  },
  permissionName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  permissionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.35,
  },
  permButton: {
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.xs,
  },
  permButtonGranted: {
    backgroundColor: Colors.mint,
  },
  permButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  permButtonTextGranted: {
    color: Colors.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    padding: 6,
    borderRadius: Radius.sm,
  },
  pauseChip: {
    flex: 1,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  pauseChipActive: {
    backgroundColor: Colors.surfaceDark,
  },
  pauseChipText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  pauseChipTextActive: {
    color: Colors.textInverse,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: Colors.border,
  },
  appName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  previewBtn: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.sm,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  previewBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
});
