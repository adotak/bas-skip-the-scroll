import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MODES, TIME_BOXES, type Mode, type TimeBox } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { ChipGroup } from '@/components/ChipGroup';
import { addRecentIntent, getRecentIntents, logSessionStart } from '@/store/storage';
import { storeSession } from '@/store/sessionStore';
import { fetchSessionFromApi } from '@/api/client';

const MODE_LABELS: Record<Mode, string> = {
  learn: 'Learn',
  fix: 'Fix',
  watch: 'Watch',
  read: 'Read',
};

export default function IntentScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [intent, setIntent] = useState('');
  const [mode, setMode] = useState<Mode>('learn');
  const [timeBox, setTimeBox] = useState<TimeBox>(10);
  const [recentIntents, setRecentIntents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getRecentIntents().then(setRecentIntents);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = intent.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    try {
      const session = await fetchSessionFromApi(trimmed, mode, timeBox);
      storeSession(session);

      await Promise.all([
        addRecentIntent(trimmed),
        logSessionStart({
          sessionId: session.id,
          intent: session.intent,
          mode: session.mode,
          timeboxMin: session.timeboxMin,
          cardCount: session.cards.length,
        }),
      ]);

      router.push(`/deck/${session.id}`);
      setRecentIntents(await getRecentIntents());
    } finally {
      setIsLoading(false);
    }
  }, [intent, mode, timeBox, isLoading]);

  const handleRecentTap = (text: string) => {
    setIntent(text);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.topBar}>
            <Text style={styles.logo}>Skip the Scroll</Text>
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
                onPress={() => router.push('/settings')}
                style={styles.iconBtn}
                accessibilityLabel="Open settings"
              >
                <Text style={styles.iconBtnText}>⚙</Text>
              </Pressable>
            </View>
          </View>

          {from ? (
            <View style={styles.fromBanner}>
              <Text style={styles.fromBannerText}>
                Redirected from <Text style={styles.fromAppName}>{from}</Text>
              </Text>
              <Text style={styles.subtitle}>What did you come to do?</Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>What do you need?</Text>
          )}

          {/* Intent input */}
          <TextInput
            style={styles.input}
            value={intent}
            onChangeText={setIntent}
            placeholder="e.g. learn React hooks"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoCorrect={false}
          />

          {/* Mode chips */}
          <Text style={styles.sectionLabel}>Mode</Text>
          <ChipGroup
            options={MODES}
            selected={mode}
            onSelect={setMode}
            labels={MODE_LABELS}
          />

          {/* Time-box chips */}
          <Text style={styles.sectionLabel}>Time</Text>
          <ChipGroup
            options={TIME_BOXES}
            selected={timeBox}
            onSelect={setTimeBox}
            suffix="min"
          />

          {/* Recent intents */}
          {recentIntents.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Recent</Text>
              <FlatList
                data={recentIntents}
                keyExtractor={(item, i) => `${item}-${i}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.recentItem}
                    onPress={() => handleRecentTap(item)}
                  >
                    <Text style={styles.recentText}>{item}</Text>
                  </Pressable>
                )}
              />
            </>
          )}

          {/* Spacer */}
          <View style={styles.flex} />

          {/* Submit */}
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
        </View>
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
    flex: 1,
    padding: Spacing.lg,
  },
  logo: {
    color: Colors.accent,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  iconBtn: {
    padding: Spacing.xs + 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBtnText: {
    fontSize: FontSize.lg,
  },
  fromBanner: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    marginBottom: Spacing.md,
  },
  fromBannerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 2,
  },
  fromAppName: {
    color: Colors.accent,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: FontSize.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  recentItem: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  recentText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
