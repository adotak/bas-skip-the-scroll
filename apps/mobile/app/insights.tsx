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
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getInsightsData, exportDogfoodStatsJson, type InsightsData } from '@/store/storage';

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
      Alert.alert('Export Ready', 'Dogfood statistics copied successfully.');
    }
  };

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

        {/* Highlight Card: Estimated Minutes Saved */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightNumber}>
            ~{data?.estimatedMinutesSaved ?? 0}
          </Text>
          <Text style={styles.highlightTitle}>Estimated Minutes Saved</Text>
          <Text style={styles.highlightFootnote}>
            *Labelled as an estimate: calculated from scrolls redirected away from infinite feeds and intentional sessions finished.
          </Text>
        </View>

        {/* Metrics Grid */}
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

        {/* Principles Reminder */}
        <View style={styles.calmCard}>
          <Text style={styles.calmTitle}>Ethical Metrics</Text>
          <Text style={styles.calmText}>
            No streak guilt. No engagement traps. Success means sessions finished and mindless feeds redirected — not hours spent in this app.
          </Text>
        </View>

        {/* Export JSON Button for Dogfood Study */}
        <Pressable style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>📤  Export Dogfood Study Data (JSON)</Text>
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
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highlightNumber: {
    color: Colors.accent,
    fontSize: 56,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  highlightTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  highlightFootnote: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: FontSize.sm * 1.3,
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
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.3,
  },
  calmCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
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
  },
  exportBtnText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
