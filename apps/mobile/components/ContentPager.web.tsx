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
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (typeof activePage === 'number' && pageSize.width > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: activePage * pageSize.width, y: 0, animated: true });
    }
  }, [activePage, pageSize.width]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageSize.width > 0) {
      onPageSelected(Math.round(event.nativeEvent.contentOffset.x / pageSize.width));
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
      contentOffset={{ x: initialPage * pageSize.width, y: 0 }}
      onMomentumScrollEnd={handleScrollEnd}
      onLayout={(event) =>
        setPageSize({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }
      style={style}
    >
      {React.Children.map(children, (child) => (
        <View
          style={{
            width: pageSize.width || '100%',
            height: pageSize.height || '100%',
            minHeight: 0,
          }}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
}
