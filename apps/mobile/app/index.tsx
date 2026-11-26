import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { FloatingMenuDock } from '@/components/FloatingMenuDock';
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

  const detectedLang = useMemo(
    () => (intent.trim() ? detectIntentLanguage(intent) : lang),
    [intent, lang]
  );
  const effectiveLang: Language = detectedLang !== 'en' ? detectedLang : lang;

  const launchSession = useCallback(async (session: Session) => {
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
  }, []);

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

  const handleSelectLanguage = useCallback(async (nextLang: Language) => {
    setLang(nextLang);
    await setPreferredLanguage(nextLang);
  }, []);

  const handleClearRecents = useCallback(async () => {
    await clearRecentIntents();
    setRecentIntents([]);
  }, []);

  const starters = useMemo(
    () => QUICK_STARTERS[mode][effectiveLang] ?? QUICK_STARTERS[mode].en,
    [mode, effectiveLang]
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Marquee Strip (.marquee-top line 10429) */}
      <View style={styles.marqueeTop}>
        <Text style={styles.marqueeText} numberOfLines={1}>
          INTENT FIRST  ✦  FINITE 3–7 CARD DECKS  ✦  NO INFINITE FEEDS
        </Text>
        <View style={styles.budgetTagYellow}>
          <Text style={styles.budgetTagYellowText}>ETHICAL</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerBox}>
            {/* Header Main (.header-main__container line 3210) */}
            <View style={styles.headerMain}>
              <View style={styles.logoGroup}>
                <Text style={styles.monogramLogo}>W.</Text>
                <Text style={styles.logo}>Skip the Scroll</Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => router.push('/library')}
                  style={styles.headerOutlineBtn}
                  accessibilityLabel="Open library"
                >
                  <Text style={styles.headerOutlineBtnText}>Library</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/insights')}
                  style={styles.headerOutlineBtn}
                  accessibilityLabel="Open insights"
                >
                  <Text style={styles.headerOutlineBtnText}>Insights</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/settings')}
                  style={styles.headerDarkBtn}
                  accessibilityLabel="Open settings"
                >
                  <Text style={styles.headerDarkBtnText}>Gate ⚙</Text>
                </Pressable>
              </View>
            </View>

            {/* Active Break Allowance Banner */}
            {activeAllowance && (
              <View style={styles.allowanceBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.allowanceTitle}>
                    ⏱ ACTIVE {activeAllowance.minutes}M BREAK ({activeAllowance.targetApp.toUpperCase()})
                  </Text>
                  <Text style={styles.allowanceSub}>
                    Pause Gate will reappear when your time-box expires.
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

            {/* Editorial Hero Heading (.c-heading line 9205) */}
            <View style={styles.cHeading}>
              <Text style={styles.cHeadingTop}>
                {from
                  ? `REDIRECTED FROM ${from.toUpperCase()}`
                  : prevIntent
                    ? `REFINING "${prevIntent.toUpperCase()}"`
                    : 'INTENTIONAL KNOWLEDGE ENGINE'}
              </Text>
              <View style={styles.cHeadingMiddle}>
                <Text style={styles.heading1}>
                  {from ? 'What did you come to do?' : 'What do you need?'}
                </Text>
                <View style={styles.stickerBadge}>
                  <Text style={styles.stickerBadgeText}>MAX 7 CARDS</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Declare your intent. Get a curated, finite deck with 3-bullet TL;DRs and a real stopping point.
              </Text>
            </View>

            {/* Search & Filter Studio Card (.card-course / .search-form) */}
            <View style={styles.studioCard}>
              {/* Intent Input (.search-form / .text-input) */}
              <Text style={styles.formFieldLabel}>YOUR DECLARED INTENT (*)</Text>
              <View style={styles.searchForm}>
                <Text style={styles.searchIcon}>🔍</Text>
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

              {/* Language Pills */}
              <View style={styles.filterGroupRow}>
                <Text style={styles.formFieldLabel}>
                  SUMMARY LANGUAGE
                  {detectedLang !== 'en'
                    ? ` · AUTO-DETECTED: ${LANGUAGE_LABELS[detectedLang].toUpperCase()}`
                    : ''}
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

              {/* Mode Chips (.nav-filters__container) */}
              <Text style={styles.formFieldLabel}>SESSION MODE</Text>
              <ChipGroup
                options={MODES}
                selected={mode}
                onSelect={setMode}
                labels={MODE_LABELS}
                icons={MODE_ICONS}
              />

              {/* Time-box Chips */}
              <Text style={[styles.formFieldLabel, { marginTop: Spacing.md }]}>
                TIME-BOX ALLOWANCE
              </Text>
              <ChipGroup
                options={TIME_BOXES}
                selected={timeBox}
                onSelect={setTimeBox}
                suffix="min"
              />

              {/* Primary Submit Button (.button--large) */}
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
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                    <Text style={styles.submitText}>Curating deck...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>Skip the Scroll</Text>
                )}
              </Pressable>

              {/* Instant Offline Demo Deck Button */}
              {!isLoading && (
                <Pressable
                  style={styles.instantOfflineBtn}
                  onPress={handleLaunchOfflineFallback}
                >
                  <Text style={styles.instantOfflineText}>
                    ⚡ Launch Instant Offline Deck ({timeBox}m · {MODE_LABELS[mode]}) →
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Loading Skeleton */}
            {isLoading && (
              <LoadingDeckSkeleton
                intent={intent.trim()}
                mode={mode}
                timeBox={timeBox}
              />
            )}

            {/* Error Alert + Smart Offline Fallback */}
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
                      ⚡ Open Local Curated Deck for “{intent.trim()}” →
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Contextual Starters (.list-tags & .button--tag line 1457) */}
            {!isLoading && (
              <View style={styles.sectionBlock}>
                <View style={styles.headingSection}>
                  <Text style={styles.headingSectionTitle}>
                    Curated Prompts · {MODE_LABELS[mode]}
                  </Text>
                  <Text style={styles.headingSectionRight}>1-TAP FILL</Text>
                </View>
                <View style={styles.listTags}>
                  {starters.map((prompt) => (
                    <Pressable
                      key={prompt}
                      style={styles.buttonTag}
                      onPress={() => setIntent(prompt)}
                    >
                      <Text style={styles.buttonTagText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Intents Table (.tb-dotteds line 9452) */}
            {recentIntents.length > 0 && !isLoading && (
              <View style={styles.sectionBlock}>
                <View style={styles.headingSection}>
                  <Text style={styles.headingSectionTitle}>Recent Intents</Text>
                  <Pressable onPress={handleClearRecents}>
                    <Text style={styles.clearRecentText}>Clear History</Text>
                  </Pressable>
                </View>

                <View style={styles.tbDotteds}>
                  {recentIntents.map((item, i) => (
                    <Pressable
                      key={`${item}-${i}`}
                      style={styles.tbRow}
                      onPress={() => setIntent(item)}
                    >
                      <View style={styles.tbIndexCircle}>
                        <Text style={styles.tbIndexText}>0{i + 1}</Text>
                      </View>
                      <Text style={styles.recentText} numberOfLines={1}>
                        {item}
                      </Text>
                      <View style={styles.tbViewBtn}>
                        <Text style={styles.tbViewBtnText}>Select</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Awwwards Floating Bottom Dock (.menu-float line 2652) */}
        <FloatingMenuDock
          activeTab="intent"
          ctaLabel="Curate →"
          onCtaPress={
            intent.trim() ? handleSubmit : handleLaunchOfflineFallback
          }
          ctaDisabled={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg, // #F8F8F8
  },
  flex: {
    flex: 1,
  },
  marqueeTop: {
    height: 38,
    backgroundColor: Colors.surfaceDark, // #222222
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  marqueeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  budgetTagYellow: {
    backgroundColor: Colors.lemon, // #FFF083
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  budgetTagYellowText: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: '900',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110,
    alignItems: 'center',
  },
  innerBox: {
    width: '100%',
    maxWidth: 780,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monogramLogo: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  logo: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerOutlineBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  headerOutlineBtnText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  headerDarkBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDarkBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  allowanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lemonSoft,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  allowanceTitle: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  allowanceSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  endAllowanceBtn: {
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  endAllowanceText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  cHeading: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  cHeadingTop: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cHeadingMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  heading1: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: FontSize.xxl * 1.1,
  },
  stickerBadge: {
    backgroundColor: Colors.mint, // #AAEEC4
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  stickerBadgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.45,
  },
  studioCard: {
    backgroundColor: Colors.surface, // #FFFFFF (.card-course)
    borderRadius: Radius.lg,         // 16px
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  formFieldLabel: {
    color: Colors.textMuted,         // #A7A7A7 (.form-field__label)
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  searchForm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight, // #EDEDED (.search-form)
    borderRadius: Radius.sm,
    height: 52,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    height: '100%',
  },
  clearInputBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  clearInputText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  filterGroupRow: {
    marginBottom: Spacing.md,
  },
  langPills: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  langPillActive: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surfaceDark,
  },
  langPillText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  langPillTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: Colors.surfaceDark, // #222222 (.button--large)
    height: 54,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.35,
  },
  submitText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instantOfflineBtn: {
    marginTop: Spacing.sm,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.lemonSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantOfflineText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.vermilion,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    color: Colors.vermilion,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  offlineFallbackBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xs,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  offlineFallbackBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: Spacing.lg,
  },
  headingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: Colors.borderStrong,
  },
  headingSectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  headingSectionRight: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  listTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonTag: {
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  buttonTagText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  clearRecentText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  tbDotteds: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  tbIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbIndexText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  recentText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  tbViewBtn: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tbViewBtnText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
