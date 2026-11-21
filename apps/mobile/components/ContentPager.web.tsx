import React, { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

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
  const [pageWidth, setPageWidth] = useState(0);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth > 0) {
      onPageSelected(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
    }
  };

  return (
    <ScrollView
      horizontal
      pagingEnabled
      directionalLockEnabled
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: initialPage * pageWidth, y: 0 }}
      onMomentumScrollEnd={handleScrollEnd}
      onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
      style={style}
    >
      {React.Children.map(children, (child) => (
        <View style={{ width: pageWidth || '100%' }}>{child}</View>
      ))}
    </ScrollView>
  );
}
