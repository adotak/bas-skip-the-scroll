import React, { useState, useRef, useEffect } from 'react';
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
  activePage?: number;
  onPageSelected: (position: number) => void;
};

export default function ContentPager({
  children,
  style,
  initialPage = 0,
  activePage,
  onPageSelected,
}: ContentPagerProps) {
  const [pageWidth, setPageWidth] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (typeof activePage === 'number' && pageWidth > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: activePage * pageWidth, y: 0, animated: true });
    }
  }, [activePage, pageWidth]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth > 0) {
      onPageSelected(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
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
