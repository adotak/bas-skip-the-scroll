import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GateView } from '@/components/GateView';
import { Colors } from '@/constants/theme';
import { AndroidGate } from '@/modules/android-gate';

export default function GatePreviewScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const targetApp = from || 'Instagram';
  const pauseSeconds = AndroidGate.getPauseDuration();

  const handleLookUp = () => {
    router.replace(`/?from=${encodeURIComponent(targetApp)}`);
  };

  const handleTakeBreak = (minutes: number) => {
    // In preview mode: return to settings or previous screen
    router.back();
  };

  const handleNeverMind = () => {
    // Return to start
    router.replace('/');
  };

  const handleContinueAnyway = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <GateView
        targetApp={targetApp}
        initialPauseSeconds={pauseSeconds}
        onLookUp={handleLookUp}
        onTakeBreak={handleTakeBreak}
        onNeverMind={handleNeverMind}
        onContinueAnyway={handleContinueAnyway}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
