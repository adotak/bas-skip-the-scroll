import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import PagerView from 'react-native-pager-view';

type ContentPagerProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  initialPage?: number;
  onPageSelected: (position: number) => void;
};

export default function ContentPager({
  children,
  style,
  initialPage = 0,
  onPageSelected,
}: ContentPagerProps) {
  return (
    <PagerView
      style={style}
      initialPage={initialPage}
      onPageSelected={(event) => onPageSelected(event.nativeEvent.position)}
    >
      {children}
    </PagerView>
  );
}
