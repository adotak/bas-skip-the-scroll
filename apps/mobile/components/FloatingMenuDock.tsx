import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export type FloatingDockTab = 'intent' | 'library' | 'insights' | 'gate' | 'settings';

interface FloatingMenuDockProps {
  activeTab: FloatingDockTab;
  ctaLabel?: string;
  onCtaPress?: () => void;
  ctaDisabled?: boolean;
}

const DOCK_ITEMS: { key: FloatingDockTab; label: string; route: string; dotColor: string }[] = [
  { key: 'intent', label: 'Intent', route: '/', dotColor: Colors.mint },
  { key: 'library', label: 'Library', route: '/library', dotColor: Colors.lemon },
  { key: 'insights', label: 'Insights', route: '/insights', dotColor: Colors.sky },
  { key: 'gate', label: 'Gate', route: '/gate', dotColor: Colors.vermilion },
  { key: 'settings', label: 'Settings', route: '/settings', dotColor: '#DEDEDE' },
];

/**
 * Modeled directly on UI.html `.menu-float` (lines 2060-2652):
 * - Floating dark glass wrapper (`rgba(34, 34, 34, 0.92)`, padding 6px, border-radius 12px)
 * - Primary monogram block (`w.` / `s.` + `.section` breadcrumb)
 * - Secondary inner pill bar (`#3E3E3E` bg, `#4E4E4E` 1px borders)
 * - Tertiary high-contrast CTA button (`#AAEEC4` / `#FFF083` with `#222` ink)
 */
export const FloatingMenuDock = memo(function FloatingMenuDock({
  activeTab,
  ctaLabel,
  onCtaPress,
  ctaDisabled = false,
}: FloatingMenuDockProps) {
  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.wrapper}>
        {/* Primary Monogram + Breadcrumb (.menu-float__layout--primary) */}
        <Pressable
          onPress={() => router.replace('/')}
          style={styles.primaryBlock}
          accessibilityRole="button"
          accessibilityLabel="Home Intent Screen"
        >
          <Text style={styles.monogram}>W.</Text>
          <Text style={styles.breadcrumbSub}>{activeTab}</Text>
        </Pressable>

        {/* Secondary Navigation Pills (.menu-float__layout--secondary) */}
        <View style={styles.secondaryBlock}>
          {DOCK_ITEMS.map((item) => {
            const isActive = item.key === activeTab;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (!isActive) {
                    router.push(item.route as '/');
                  }
                }}
                style={[
                  styles.navItem,
                  isActive && { borderColor: item.dotColor, backgroundColor: '#2A2A2A' },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                {isActive && (
                  <View style={[styles.activeDot, { backgroundColor: item.dotColor }]} />
                )}
                <Text
                  style={[
                    styles.navItemText,
                    isActive && { color: item.dotColor, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Optional Tertiary Action (.menu-float__layout--tertiary) */}
        {ctaLabel && onCtaPress && (
          <Pressable
            onPress={onCtaPress}
            disabled={ctaDisabled}
            style={[styles.tertiaryBtn, ctaDisabled && styles.tertiaryBtnDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.tertiaryBtnText}>{ctaLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 22 : 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: Spacing.sm,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGlass,
    padding: 6,
    borderRadius: Radius.md,
    gap: 6,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  monogram: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  breadcrumbSub: {
    color: '#A7A7A7',
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginLeft: 3,
  },
  secondaryBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDarkInner,
    padding: 4,
    borderRadius: Radius.sm,
    gap: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceDarkBorder,
    gap: 5,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  navItemText: {
    color: '#DEDEDE',
    fontSize: 12,
    fontWeight: '500',
  },
  tertiaryBtn: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryBtnDisabled: {
    opacity: 0.4,
  },
  tertiaryBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
