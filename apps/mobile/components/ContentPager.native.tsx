import React, { useRef, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import PagerView from 'react-native-pager-view';

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
  const pagerRef = useRef<PagerView | null>(null);

  useEffect(() => {
    if (typeof activePage === 'number' && pagerRef.current) {
      pagerRef.current.setPage(activePage);
    }
  }, [activePage]);

  return (
    <PagerView
      ref={pagerRef}
      style={style}
      initialPage={initialPage}
      onPageSelected={(event) => onPageSelected(event.nativeEvent.position)}
    >
      {children}
    </PagerView>
  );
}
