import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MODES, type Mode } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import {
  getInsightsData,
  exportDogfoodStatsJson,
  exportStudyGuideMarkdown,
  type InsightsData,
} from '@/store/storage';

const MODE_LABELS: Record<Mode, string> = {
  learn: '📘 Learn',
  fix: '🛠 Fix',
  watch: '🎬 Watch',
  read: '📄 Read',
};

export default function InsightsScreen() {
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [data, setData] = useState<InsightsData | null>(null);

  const loadData = useCallback(async () => {
    const stats = await getInsightsData(selectedDays);
    setData(stats);
  }, [selectedDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    try {
      const jsonStr = await exportDogfoodStatsJson();
      await Share.share({
        message: jsonStr,
        title: 'SkipTheScroll_Stats_Export.json',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not open the share sheet. Please try again.');
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const md = await exportStudyGuideMarkdown();
      await Share.share({
        message: md,
        title: 'SkipTheScroll_StudyGuide.md',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not share study guide.');
    }
  };

  const maxDailyCount = Math.max(
    1,
    ...(data?.dailyActivity?.map((d) => d.sessionsStarted) ?? [1])
  );
  const totalModeSessions = Math.max(
    1,
    Object.values(data?.modeBreakdown ?? { learn: 0, fix: 0, watch: 0, read: 0 }).reduce(
      (a, b) => a + b,
      0
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Insights</Text>
        </View>

        {/* Time Window Switcher */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, selectedDays === 7 && styles.tabActive]}
            onPress={() => setSelectedDays(7)}
          >
            <Text
              style={[
                styles.tabText,
                selectedDays === 7 && styles.tabTextActive,
              ]}
            >
              Last 7 Days (Weekly)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, selectedDays === 30 && styles.tabActive]}
            onPress={() => setSelectedDays(30)}
          >
            <Text
              style={[
                styles.tabText,
                selectedDays === 30 && styles.tabTextActive,
              ]}
            >
              Last 30 Days
            </Text>
          </Pressable>
        </View>

        {/* Highlight Card: Estimated Minutes Saved + Intentionality Score */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightTopRow}>
            <View style={styles.highlightCol}>
              <Text style={styles.highlightNumber}>
                ~{data?.estimatedMinutesSaved ?? 0}
              </Text>
              <Text style={styles.highlightTitle}>Estimated Minutes Saved</Text>
            </View>
            <View style={styles.scoreBadgeBox}>
              <Text style={styles.scoreValue}>{data?.intentionalityScore ?? 100}%</Text>
              <Text style={styles.scoreLabel}>Intentionality</Text>
            </View>
          </View>
          <Text style={styles.highlightFootnote}>
            *Labelled as an estimate: calculated from scrolls redirected away from infinite feeds and intentional sessions finished.
          </Text>
        </View>

        {/* Primary Metrics Grid */}
        <View style={styles.grid}>
          {/* Card 1: Sessions Done Rate */}
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{data?.doneRatePercent ?? 0}%</Text>
            <Text style={styles.gridLabel}>"Done" Rate</Text>
            <Text style={styles.gridSub}>
              Sessions where you got what you needed
            </Text>
          </View>

          {/* Card 2: Completed Sessions */}
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>
              {data?.sessionsFinished ?? 0}
              <Text style={styles.gridDenominator}>/{data?.sessionsStarted ?? 0}</Text>
            </Text>
            <Text style={styles.gridLabel}>Sessions Finished</Text>
            <Text style={styles.gridSub}>Finite decks completed</Text>
          </View>

          {/* Card 3: Gate Redirects */}
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{data?.gateRedirects ?? 0}</Text>
            <Text style={styles.gridLabel}>Scrolls Redirected</Text>
            <Text style={styles.gridSub}>Autopilot feed opens turned into intent</Text>
          </View>

          {/* Card 4: Continue Anyway */}
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{data?.continueAnyway ?? 0}</Text>
            <Text style={styles.gridLabel}>Continued Anyway</Text>
            <Text style={styles.gridSub}>Deliberate bypasses tapped</Text>
          </View>
        </View>

        {/* 7-Day Activity Sparkline Chart */}
        {data?.dailyActivity && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>7-Day Intentional Rhythm</Text>
            <Text style={styles.sectionSubtitle}>
              Daily finite sessions started and finished (no streak penalties)
            </Text>
            <View style={styles.chartRow}>
              {data.dailyActivity.map((pt) => {
                const heightPct = Math.max(12, Math.round((pt.sessionsStarted / maxDailyCount) * 100));
                return (
                  <View key={pt.isoDate} style={styles.barCol}>
                    <Text style={styles.barCountText}>{pt.sessionsStarted}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${heightPct}%` },
                          pt.sessionsStarted === 0 && styles.barFillEmpty,
                        ]}
                      />
                    </View>
                    <Text style={styles.barDayLabel}>{pt.dateLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Mode Distribution & Mastery Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Intent Mode Distribution</Text>
          <View style={styles.modeList}>
            {MODES.map((m) => {
              const count = data?.modeBreakdown?.[m] ?? 0;
              const pct = Math.round((count / totalModeSessions) * 100);
              return (
                <View key={m} style={styles.modeRow}>
                  <View style={styles.modeLabelRow}>
                    <Text style={styles.modeName}>{MODE_LABELS[m]}</Text>
                    <Text style={styles.modeCount}>{count} sessions</Text>
                  </View>
                  <View style={styles.modeBarTrack}>
                    <View style={[styles.modeBarFill, { width: `${Math.max(4, pct)}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.masteryRow}>
            <View style={styles.masteryPill}>
              <Text style={styles.masteryNum}>{data?.totalTakeawaysChecked ?? 0}</Text>
              <Text style={styles.masteryText}>Takeaways Checked ✓</Text>
            </View>
            <View style={styles.masteryPill}>
              <Text style={styles.masteryNum}>
                {data?.completedCardsCount ?? 0}/{data?.savedCardsCount ?? 0}
              </Text>
              <Text style={styles.masteryText}>Saved Cards Reviewed</Text>
            </View>
          </View>
        </View>

        {/* Principles Reminder */}
        <View style={styles.calmCard}>
          <Text style={styles.calmTitle}>Ethical Metrics</Text>
          <Text style={styles.calmText}>
            No streak guilt. No engagement traps. Success means sessions finished and mindless feeds redirected — not hours spent in this app.
          </Text>
        </View>

        {/* Export Buttons for Dogfood Study & Study Guide */}
        <Pressable style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>📤  Export Dogfood Study Data (JSON)</Text>
        </Pressable>

        <Pressable style={styles.exportSecondaryBtn} onPress={handleExportMarkdown}>
          <Text style={styles.exportSecondaryBtnText}>
            📝  Export Saved Library Study Guide (Markdown)
          </Text>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.bg,
    fontWeight: '700',
  },
  highlightCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  highlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  highlightCol: {
    flex: 1,
  },
  highlightNumber: {
    color: Colors.accent,
    fontSize: 48,
    fontWeight: '800',
  },
  highlightTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  scoreBadgeBox: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  scoreValue: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  highlightFootnote: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    lineHeight: FontSize.xs * 1.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  gridItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridNumber: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: 2,
  },
  gridDenominator: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  gridLabel: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.35,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 112,
    paddingTop: Spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barCountText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    width: 18,
    height: 64,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.xs,
  },
  barFillEmpty: {
    backgroundColor: Colors.surfaceLight,
  },
  barDayLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
  modeList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeRow: {
    gap: 4,
  },
  modeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modeCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  modeBarTrack: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  modeBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
  },
  masteryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  masteryPill: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  masteryNum: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  masteryText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  calmCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  calmTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  calmText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exportBtnText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  exportSecondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  exportSecondaryBtnText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
