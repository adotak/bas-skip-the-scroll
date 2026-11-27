import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  MODES,
  TIME_BOXES,
  LANGUAGES,
  LANGUAGE_LABELS,
  detectIntentLanguage,
  type Mode,
  type TimeBox,
  type Language,
  type Session,
} from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { ChipGroup } from '@/components/ChipGroup';
import { LoadingDeckSkeleton } from '@/components/LoadingDeckSkeleton';
import {
  addRecentIntent,
  clearRecentIntents,
  getRecentIntents,
  logSessionStart,
  getPreferredLanguage,
  setPreferredLanguage,
  getActiveAllowance,
  clearActiveAllowance,
  type ActiveAllowance,
} from '@/store/storage';
import { storeSession } from '@/store/sessionStore';
import { fetchSessionFromApi, SessionFetchError } from '@/api/client';
import { buildDynamicOfflineSession } from '@/fixtures/sessions';

const MODE_LABELS: Record<Mode, string> = {
  learn: 'Learn',
  fix: 'Fix',
  watch: 'Watch',
  read: 'Read',
};

const MODE_ICONS: Record<Mode, string> = {
  learn: '📘',
  fix: '🛠',
  watch: '🎬',
  read: '📄',
};

const QUICK_STARTERS: Record<Mode, Record<Language, string[]>> = {
  learn: {
    en: [
      'learn React hooks',
      'TypeScript generics & type narrowing',
      'how PostgreSQL indexing works',
    ],
    'roman-ur': [
      'react hooks kaise kaam karte hain',
      'typescript generics asaan alfaaz mein',
      'rest api aur graphql mein kya farq hai',
    ],
    ur: [
      'ری ایکٹ ہکس کیسے کام کرتے ہیں',
      'سسٹم ڈیزائن کے بنیادی اصول',
    ],
  },
  fix: {
    en: [
      'fix CORS error in Express',
      'fix React useEffect infinite loop',
      'resolve Git merge conflict cleanly',
    ],
    'roman-ur': [
      'express mein cors error kaise theek karein',
      'react useeffect infinite loop masla',
    ],
    ur: [
      'ایکسپریس میں کورس ایرر کا حل',
    ],
  },
  watch: {
    en: [
      'system design interview prep',
      'JavaScript event loop visualised',
      'Docker containers in 10 minutes',
    ],
    'roman-ur': [
      'system design interview ki tayari kaise karein',
      'docker containers kya hain',
    ],
    ur: [
      'سسٹم ڈیزائن انٹرویو گائیڈ',
    ],
  },
  read: {
    en: [
      'designing data-intensive applications summary',
      'clean architecture in TypeScript',
      'OWASP top 10 security essentials',
    ],
    'roman-ur': [
      'clean code likhne ke behtareen usool',
      'web security aur authentication guide',
    ],
    ur: [
      'بہترین کوڈنگ کے اصول',
    ],
  },
};

export default function IntentScreen() {
  const { from, refine, prevIntent } = useLocalSearchParams<{
    from?: string;
    refine?: string;
    prevIntent?: string;
  }>();

  const [intent, setIntent] = useState(refine ?? '');
  const [mode, setMode] = useState<Mode>('learn');
  const [timeBox, setTimeBox] = useState<TimeBox>(10);
  const [lang, setLang] = useState<Language>('en');
  const [recentIntents, setRecentIntents] = useState<string[]>([]);
  const [activeAllowance, setActiveAllowanceState] = useState<ActiveAllowance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canUseOfflineFallback, setCanUseOfflineFallback] = useState(false);

  useEffect(() => {
    getRecentIntents().then(setRecentIntents);
    getPreferredLanguage().then(setLang);
    getActiveAllowance().then(setActiveAllowanceState);
  }, []);

  useEffect(() => {
    if (refine) {
      setIntent(refine);
    }
  }, [refine]);

  const detectedLang = intent.trim() ? detectIntentLanguage(intent) : lang;
  const effectiveLang: Language = detectedLang !== 'en' ? detectedLang : lang;

  const launchSession = useCallback(
    async (session: Session) => {
      storeSession(session);
      await Promise.all([
        addRecentIntent(session.intent),
        logSessionStart({
          sessionId: session.id,
          intent: session.intent,
          mode: session.mode,
          timeboxMin: session.timeboxMin,
          lang: session.lang,
          cardCount: session.cards.length,
        }),
      ]);
      setRecentIntents(await getRecentIntents());
      router.push(`/deck/${session.id}`);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = intent.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setCanUseOfflineFallback(false);
    try {
      const session = await fetchSessionFromApi(trimmed, mode, timeBox, effectiveLang);
      await launchSession(session);
    } catch (err) {
      if (err instanceof SessionFetchError) {
        setErrorMessage(err.message);
        setCanUseOfflineFallback(err.kind === 'offline' || err.kind === 'server');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
        setCanUseOfflineFallback(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [intent, mode, timeBox, effectiveLang, isLoading, launchSession]);

  const handleLaunchOfflineFallback = useCallback(async () => {
    const trimmed = intent.trim() || 'learn React hooks';
    setErrorMessage(null);
    setCanUseOfflineFallback(false);
    const offlineSession = buildDynamicOfflineSession(trimmed, mode, timeBox, effectiveLang);
    await launchSession(offlineSession);
  }, [intent, mode, timeBox, effectiveLang, launchSession]);

  const handleSelectLanguage = async (nextLang: Language) => {
    setLang(nextLang);
    await setPreferredLanguage(nextLang);
  };

  const handleClearRecents = async () => {
    await clearRecentIntents();
    setRecentIntents([]);
  };

  const starters = QUICK_STARTERS[mode][effectiveLang] ?? QUICK_STARTERS[mode].en;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.brandEyebrow}>INTENTIONAL KNOWLEDGE</Text>
              <Text style={styles.logo}>Skip the Scroll</Text>
            </View>
            <View style={styles.topBarActions}>
              <Pressable
                onPress={() => router.push('/library')}
                style={styles.iconBtn}
                accessibilityLabel="Open library"
              >
                <Text style={styles.iconBtnText}>📚</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/insights')}
                style={styles.iconBtn}
                accessibilityLabel="Open insights"
              >
                <Text style={styles.iconBtnText}>📊</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/gate')}
                style={styles.iconBtn}
                accessibilityLabel="Preview pause gate"
              >
                <Text style={styles.iconBtnText}>🛡</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings')}
                style={styles.iconBtn}
                accessibilityLabel="Open settings"
              >
                <Text style={styles.iconBtnText}>⚙</Text>
              </Pressable>
            </View>
          </View>

          {/* Active Time-Box Break Allowance Banner */}
          {activeAllowance && (
            <View style={styles.allowanceBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.allowanceTitle}>
                  ⏱ Active {activeAllowance.minutes}m Break Allowance ({activeAllowance.targetApp})
                </Text>
                <Text style={styles.allowanceSub}>
                  Gate will reappear automatically when your break expires.
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  await clearActiveAllowance();
                  setActiveAllowanceState(null);
                }}
                style={styles.endAllowanceBtn}
              >
                <Text style={styles.endAllowanceText}>End Break</Text>
              </Pressable>
            </View>
          )}

          {/* Redirected from Gate Banner */}
          {from ? (
            <View style={styles.fromBanner}>
              <Text style={styles.fromBannerText}>
                ✦ Redirected from <Text style={styles.fromAppName}>{from}</Text>
              </Text>
              <Text style={styles.subtitle}>What did you come to do?</Text>
            </View>
          ) : prevIntent ? (
            <View style={styles.fromBanner}>
              <Text style={styles.fromBannerText}>
                ↻ Refining previous session:{' '}
                <Text style={styles.fromAppName}>“{prevIntent}”</Text>
              </Text>
              <Text style={styles.subtitle}>Sharpen your next finite deck:</Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>
              What do you need? Get a finite 3–7 card deck with a real end.
            </Text>
          )}

          {/* Intent Input Card */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={intent}
              onChangeText={(val) => {
                setIntent(val);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={
                effectiveLang === 'roman-ur'
                  ? 'e.g. react hooks kaise kaam karte hain'
                  : effectiveLang === 'ur'
                    ? 'مثلاً ری ایکٹ ہکس کیسے کام کرتے ہیں'
                    : 'e.g. learn React hooks'
              }
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={handleSubmit}
              autoCorrect={false}
            />
            {intent.length > 0 && (
              <Pressable
                onPress={() => setIntent('')}
                style={styles.clearInputBtn}
                accessibilityLabel="Clear intent input"
              >
                <Text style={styles.clearInputText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Language Selector & Auto-Detect Pill */}
          <View style={styles.langRow}>
            <Text style={styles.langLabel}>
              Summary Language
              {detectedLang !== 'en' ? ` (Auto-detected: ${LANGUAGE_LABELS[detectedLang]})` : ''}
            </Text>
            <View style={styles.langPills}>
              {LANGUAGES.map((l) => {
                const isSelected = effectiveLang === l;
                return (
                  <Pressable
                    key={l}
                    onPress={() => handleSelectLanguage(l)}
                    style={[styles.langPill, isSelected && styles.langPillActive]}
                  >
                    <Text
                      style={[
                        styles.langPillText,
                        isSelected && styles.langPillTextActive,
                      ]}
                    >
                      {LANGUAGE_LABELS[l]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Mode chips */}
          <Text style={styles.sectionLabel}>Mode</Text>
          <ChipGroup
            options={MODES}
            selected={mode}
            onSelect={setMode}
            labels={MODE_LABELS}
            icons={MODE_ICONS}
          />

          {/* Time-box chips */}
          <Text style={styles.sectionLabel}>Time-Box Budget</Text>
          <ChipGroup
            options={TIME_BOXES}
            selected={timeBox}
            onSelect={setTimeBox}
            suffix="min"
          />

          {/* Loading Skeleton */}
          {isLoading && (
            <LoadingDeckSkeleton
              intent={intent.trim()}
              mode={mode}
              timeBox={timeBox}
            />
          )}

          {/* Error + Smart Offline Deck Fallback */}
          {errorMessage && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorTitle}>Could not create a deck</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>

              {canUseOfflineFallback && (
                <Pressable
                  style={styles.offlineFallbackBtn}
                  onPress={handleLaunchOfflineFallback}
                >
                  <Text style={styles.offlineFallbackBtnText}>
                    ⚡ Launch Smart Offline Deck for “{intent.trim()}” →
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Contextual Inspiration / Starter Prompts */}
          {!isLoading && (
            <View style={styles.startersSection}>
              <Text style={styles.sectionLabel}>
                Try an Intentional Prompt ({MODE_LABELS[mode]})
              </Text>
              <View style={styles.starterChipsWrap}>
                {starters.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={styles.starterChip}
                    onPress={() => setIntent(prompt)}
                  >
                    <Text style={styles.starterChipText}>✦  {prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Recent Intents */}
          {recentIntents.length > 0 && !isLoading && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeaderRow}>
                <Text style={styles.sectionLabel}>Recent</Text>
                <Pressable onPress={handleClearRecents}>
                  <Text style={styles.clearRecentText}>Clear</Text>
                </Pressable>
              </View>
              {recentIntents.map((item, i) => (
                <Pressable
                  key={`${item}-${i}`}
                  style={styles.recentItem}
                  onPress={() => setIntent(item)}
                >
                  <Text style={styles.recentIcon}>↺</Text>
                  <Text style={styles.recentText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.spacer} />

          {/* Primary Submit Action */}
          <Pressable
            style={[
              styles.submitButton,
              (!intent.trim() || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!intent.trim() || isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={Colors.bg} size="small" />
                <Text style={styles.submitText}>Curating deck...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Skip the Scroll</Text>
            )}
          </Pressable>

          {/* Instant Offline Demo Deck Shortcut */}
          {!isLoading && (
            <Pressable
              style={styles.instantOfflineLink}
              onPress={handleLaunchOfflineFallback}
            >
              <Text style={styles.instantOfflineText}>
                Working offline? Launch local curated deck ({timeBox}m {MODE_LABELS[mode]}) →
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandEyebrow: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  logo: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  iconBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBtnText: {
    fontSize: FontSize.md,
  },
  allowanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  allowanceTitle: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  allowanceSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  endAllowanceBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  endAllowanceText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  fromBanner: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    marginBottom: Spacing.md,
  },
  fromBannerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  fromAppName: {
    color: Colors.accent,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.4,
    marginBottom: Spacing.md,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: FontSize.lg,
    padding: Spacing.md,
    paddingRight: Spacing.xxl,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  clearInputBtn: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  clearInputText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  langRow: {
    marginBottom: Spacing.xs,
  },
  langLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  langPills: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  langPill: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langPillActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  langPillText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  langPillTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  startersSection: {
    marginTop: Spacing.xs,
  },
  starterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  starterChip: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm,
  },
  starterChipText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: Spacing.xs,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearRecentText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  recentIcon: {
    color: Colors.accent,
    fontSize: FontSize.md,
  },
  recentText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.lg,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instantOfflineLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    marginTop: 4,
  },
  instantOfflineText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  errorTitle: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  offlineFallbackBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  offlineFallbackBtnText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
