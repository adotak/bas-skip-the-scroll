import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type ContentPagerProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  initialPage?: number;
  activePage?: number;
  onPageSelected: (position: number) => void;
};

declare const ContentPager: React.ComponentType<ContentPagerProps>;

export default ContentPager;
