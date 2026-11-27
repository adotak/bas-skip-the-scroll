import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GateView } from '@/components/GateView';
import { Colors } from '@/constants/theme';
import { AndroidGate } from '@/modules/android-gate';
import { setActiveAllowance } from '@/store/storage';

export default function GatePreviewScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const targetApp = from || 'Instagram';
  const pauseSeconds = AndroidGate.getPauseDuration();
  const escalationLevel: 1 | 2 | 3 =
    pauseSeconds >= 15 ? 3 : pauseSeconds >= 10 ? 2 : 1;

  const handleLookUp = () => {
    router.replace(`/?from=${encodeURIComponent(targetApp)}`);
  };

  const handleTakeBreak = async (minutes: number) => {
    await setActiveAllowance(targetApp, minutes);
    router.replace('/');
  };

  const handleNeverMind = () => {
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
        escalationLevel={escalationLevel}
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
